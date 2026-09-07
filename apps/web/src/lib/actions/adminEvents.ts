"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { parseTermineFile } from "@sv/core";
import { assertAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";

export type ActionState = { ok: boolean; error?: string; count?: number };

const dateString = (label: string) =>
  z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), label);

const createSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt.").max(200),
  start: dateString("Ungültige Startzeit."),
  end: dateString("Ungültige Endzeit.").optional().or(z.literal("")),
  location: z.string().trim().max(200).optional(),
});

/** Bulk paste is admin-only, but keep it bounded so one paste cannot stall the app. */
const MAX_IMPORT_TEXT = 100_000;
const MAX_IMPORT_EVENTS = 500;

export async function createEvent(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const me = await assertAdmin();
  const parsed = createSchema.safeParse({
    title: String(fd.get("title") ?? ""),
    start: String(fd.get("start") ?? ""),
    end: String(fd.get("end") ?? "") || undefined,
    location: String(fd.get("location") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Ungültige Eingabe." };
  }

  const start = new Date(parsed.data.start);
  const end = parsed.data.end ? new Date(parsed.data.end) : null;
  if (end && end < start) return { ok: false, error: "Ende liegt vor dem Start." };

  const created = await prisma.event.create({
    data: {
      title: parsed.data.title,
      start,
      end,
      location: parsed.data.location ?? null,
      source: "MANUAL",
      visibility: "PUBLIC",
    },
  });
  await audit(me.id, "event.create", created.id, { title: parsed.data.title });
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
  return { ok: true };
}

export async function bulkImportTermine(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const me = await assertAdmin();
  const text = String(fd.get("text") ?? "");
  if (text.length > MAX_IMPORT_TEXT) {
    return { ok: false, error: "Der Text ist zu lang." };
  }

  const stunden = parseTermineFile(text).slice(0, MAX_IMPORT_EVENTS);
  let count = 0;
  for (const s of stunden) {
    const existing = await prisma.event.findFirst({
      where: { start: s.date, lessonSlot: s.fs, source: "TERMINE" },
    });
    if (existing) continue;
    await prisma.event.create({
      data: {
        title: `SV-Stunde (${s.fs})`,
        start: s.date,
        end: s.endDate,
        lessonSlot: s.fs,
        source: "TERMINE",
        visibility: "PUBLIC",
      },
    });
    count++;
  }
  if (count) await audit(me.id, "event.bulkImport", null, { count });
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
  return { ok: true, count };
}

export async function deleteEvent(id: string) {
  const me = await assertAdmin();
  const parsed = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success) return;
  await prisma.event.delete({ where: { id: parsed.data } }).catch(() => {});
  await audit(me.id, "event.delete", parsed.data);
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
}
