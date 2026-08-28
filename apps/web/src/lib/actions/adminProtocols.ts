"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";
import { writeUpload, deleteUpload } from "@/lib/uploads";

export type ActionState = { ok: boolean; error?: string };
export type Status = "PUBLIC" | "INTERNAL" | "ARCHIVED" | "DELETED";

const STATUSES: Status[] = ["PUBLIC", "INTERNAL", "ARCHIVED", "DELETED"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function parseProtocolName(filename: string) {
  const base = filename.replace(/\.pdf$/i, "");
  const m = base.match(/(\d{1,2})\.(\d{1,2})\.?\s*(\d{4})/);
  let date: Date | null = null;
  if (m) date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const pad = (n: number) => String(n).padStart(2, "0");
  const title = date
    ? `Protokoll vom ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
    : base;
  const slug = date
    ? `sv-protokoll-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : slugify(base);
  return { title, date, slug };
}

export async function uploadProtocol(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const file = formData.get("file") as File | null;
  const statusRaw = String(formData.get("status"));
  const status: Status = STATUSES.includes(statusRaw as Status)
    ? (statusRaw as Status)
    : "PUBLIC";
  const titleOverride = String(formData.get("title") ?? "").trim();
  const dateOverride = String(formData.get("date") ?? "").trim();

  if (!file || file.size === 0) return { ok: false, error: "Bitte eine PDF-Datei wählen." };
  if (file.type && file.type !== "application/pdf") {
    return { ok: false, error: "Nur PDF-Dateien sind erlaubt." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseProtocolName(file.name);
  const date = dateOverride ? new Date(dateOverride) : parsed.date ?? new Date();
  const title = titleOverride || parsed.title;

  let slug = parsed.slug;
  let n = 1;
  while (await prisma.protocol.findUnique({ where: { slug } })) {
    slug = `${parsed.slug}-${++n}`;
  }

  const filePath = `protocols/${slug}.pdf`;
  await writeUpload(filePath, buf);
  const md5 = createHash("md5").update(buf).digest("hex");

  await prisma.protocol.create({
    data: {
      slug,
      title,
      date,
      status,
      filePath,
      originalName: file.name,
      md5Checksum: md5,
      uploadedById: user.id,
    },
  });

  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
  return { ok: true };
}

/** Move a protocol between PUBLIC / INTERNAL / ARCHIVED / DELETED (soft). */
export async function setProtocolStatus(id: string, status: Status) {
  await requireAdmin();
  await prisma.protocol.update({ where: { id }, data: { status } });
  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
  revalidatePath("/intern/dokumente");
}

/** Permanently remove a protocol and its file (trash). */
export async function hardDeleteProtocol(id: string) {
  await requireAdmin();
  const p = await prisma.protocol.findUnique({ where: { id } });
  if (p) {
    await deleteUpload(p.filePath).catch(() => {});
    await prisma.protocol.delete({ where: { id } });
  }
  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
}
