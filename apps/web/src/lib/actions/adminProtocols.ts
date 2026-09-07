"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertAdmin } from "@/lib/session";
import { writeUpload, deleteUpload } from "@/lib/uploads";
import { audit } from "@/lib/audit";

export type ActionState = { ok: boolean; error?: string };
export type Status = "PUBLIC" | "INTERNAL" | "ARCHIVED" | "DELETED";

const statusSchema = z.enum(["PUBLIC", "INTERNAL", "ARCHIVED", "DELETED"]);
const idSchema = z.string().min(1).max(64);

/** Uploads are trusted admin input, but a stray 500 MB file would still hurt. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const PDF_MAGIC = "%PDF-";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseProtocolName(filename: string) {
  const base = filename.replace(/\.pdf$/i, "");
  const m = base.match(/(\d{1,2})\.(\d{1,2})\.?\s*(\d{4})/);
  let date: Date | null = null;
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!Number.isNaN(d.getTime())) date = d;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const title = date
    ? `Protokoll vom ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
    : base;
  // Never let a filename decide the stored path: the slug is either a fixed
  // date pattern or a strictly sanitised version of the name.
  const slug = date
    ? `sv-protokoll-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : slugify(base) || `protokoll-${Date.now()}`;
  return { title, date, slug };
}

export async function uploadProtocol(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Bitte eine PDF-Datei wählen." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Die Datei ist zu groß (max. 25 MB)." };
  }
  if (file.type && file.type !== "application/pdf") {
    return { ok: false, error: "Nur PDF-Dateien sind erlaubt." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // The declared MIME type comes from the browser — check the content itself.
  if (buf.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    return { ok: false, error: "Die Datei ist kein gültiges PDF." };
  }

  const status = statusSchema.catch("PUBLIC").parse(formData.get("status"));
  const titleOverride = String(formData.get("title") ?? "").trim().slice(0, 200);
  const dateOverride = String(formData.get("date") ?? "").trim();

  const parsed = parseProtocolName(file.name);
  let date = parsed.date ?? new Date();
  if (dateOverride) {
    const d = new Date(dateOverride);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Ungültiges Datum." };
    date = d;
  }
  const title = titleOverride || parsed.title;

  let slug = parsed.slug;
  let n = 1;
  while (await prisma.protocol.findUnique({ where: { slug } })) {
    slug = `${parsed.slug}-${++n}`;
    if (n > 500) return { ok: false, error: "Konnte keinen freien Namen finden." };
  }

  const filePath = `protocols/${slug}.pdf`;
  await writeUpload(filePath, buf);
  // MD5 only as a content fingerprint — it mirrors Google Drive's md5Checksum
  // for the imported protocols and is never used as a security control.
  const md5 = createHash("md5").update(buf).digest("hex");

  const created = await prisma.protocol.create({
    data: {
      slug,
      title,
      date,
      status,
      filePath,
      originalName: file.name.slice(0, 255),
      md5Checksum: md5,
      uploadedById: user.id,
    },
  });
  await audit(user.id, "protocol.upload", created.id, { slug, status, bytes: buf.length });

  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
  revalidatePath("/intern/dokumente");
  return { ok: true };
}

/** Move a protocol between PUBLIC / INTERNAL / ARCHIVED / DELETED (soft). */
export async function setProtocolStatus(id: string, status: Status) {
  const me = await assertAdmin();
  const parsed = z.object({ id: idSchema, status: statusSchema }).safeParse({ id, status });
  if (!parsed.success) return;
  await prisma.protocol
    .update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } })
    .catch(() => {});
  await audit(me.id, "protocol.status", parsed.data.id, { status: parsed.data.status });
  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
  revalidatePath("/intern/dokumente");
}

/** Permanently remove a protocol and its file (trash). */
export async function hardDeleteProtocol(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  const p = await prisma.protocol.findUnique({ where: { id: parsed.data } });
  if (p) {
    await deleteUpload(p.filePath).catch(() => {});
    await prisma.protocol.delete({ where: { id: parsed.data } }).catch(() => {});
    await audit(me.id, "protocol.delete", parsed.data, { slug: p.slug });
  }
  revalidatePath("/admin/protokolle");
  revalidatePath("/archiv");
  revalidatePath("/intern/dokumente");
}
