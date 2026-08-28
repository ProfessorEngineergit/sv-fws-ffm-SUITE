"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { parseTermineFile } from "@sv/core";
import { requireAdmin } from "@/lib/session";

export type ActionState = { ok: boolean; error?: string; count?: number };

export async function createEvent(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const title = String(fd.get("title") ?? "").trim();
  const startRaw = String(fd.get("start") ?? "");
  if (!title) return { ok: false, error: "Titel fehlt." };
  if (!startRaw) return { ok: false, error: "Startzeit fehlt." };
  const endRaw = String(fd.get("end") ?? "");
  await prisma.event.create({
    data: {
      title,
      start: new Date(startRaw),
      end: endRaw ? new Date(endRaw) : null,
      location: String(fd.get("location") ?? "").trim() || null,
      source: "MANUAL",
      visibility: "PUBLIC",
    },
  });
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
  return { ok: true };
}

export async function bulkImportTermine(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const stunden = parseTermineFile(String(fd.get("text") ?? ""));
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
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
  return { ok: true, count };
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  await prisma.event.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/termine");
  revalidatePath("/termine");
}
