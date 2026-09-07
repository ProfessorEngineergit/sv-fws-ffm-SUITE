"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertAdmin } from "@/lib/session";
import { shareFolderWithUser, driveEnabled } from "@/lib/drive";
import { audit } from "@/lib/audit";

export type ActionState = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(64);

const folderSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1, "Name und Drive-Ordner-ID nötig.").max(120),
  // Google Drive file IDs are URL-safe base64-ish tokens; reject anything else
  // so nothing else can be smuggled into the Drive API call.
  driveId: z
    .string()
    .trim()
    .min(1, "Name und Drive-Ordner-ID nötig.")
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/, "Ungültige Drive-Ordner-ID."),
  description: z.string().trim().max(500).optional(),
});

export async function grantDriveAccess(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;

  const req = await prisma.driveAccessRequest.findUnique({ where: { id: parsed.data } });
  if (!req || req.status !== "pending") return;

  // Only ever share folders that are actually open to requests — the request
  // itself carries client-supplied IDs and must not widen the admin's intent.
  const folders = await prisma.driveFolder.findMany({
    where: { id: { in: req.folderIds }, isPublicRequestable: true },
  });

  const shared: string[] = [];
  const failed: string[] = [];
  if (driveEnabled()) {
    for (const f of folders) {
      try {
        await shareFolderWithUser(f.driveId, req.email);
        shared.push(f.id);
      } catch (e) {
        failed.push(f.id);
        console.warn("[drive] share failed:", (e as Error).message);
      }
    }
  }
  await prisma.driveAccessRequest.update({
    where: { id: parsed.data },
    data: { status: "granted", handledById: me.id, handledAt: new Date() },
  });
  await audit(me.id, "drive.grant", parsed.data, { email: req.email, shared, failed });
  revalidatePath("/admin/zugang");
}

export async function rejectDriveAccess(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  await prisma.driveAccessRequest
    .update({
      where: { id: parsed.data },
      data: { status: "rejected", handledById: me.id, handledAt: new Date() },
    })
    .catch(() => {});
  await audit(me.id, "drive.reject", parsed.data);
  revalidatePath("/admin/zugang");
}

export async function upsertDriveFolder(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const me = await assertAdmin();
  const parsed = folderSchema.safeParse({
    id: String(fd.get("id") ?? "") || undefined,
    name: String(fd.get("name") ?? ""),
    driveId: String(fd.get("driveId") ?? ""),
    description: String(fd.get("description") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const { id, name, driveId } = parsed.data;
  const description = parsed.data.description ?? null;
  if (id) {
    await prisma.driveFolder.update({ where: { id }, data: { name, driveId, description } });
    await audit(me.id, "drive.folder.update", id, { name, driveId });
  } else {
    const created = await prisma.driveFolder.create({
      data: { name, driveId, description, isPublicRequestable: true },
    });
    await audit(me.id, "drive.folder.create", created.id, { name, driveId });
  }
  revalidatePath("/admin/zugang");
  revalidatePath("/zugang");
  return { ok: true };
}

export async function deleteDriveFolder(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  await prisma.driveFolder.delete({ where: { id: parsed.data } }).catch(() => {});
  await audit(me.id, "drive.folder.delete", parsed.data);
  revalidatePath("/admin/zugang");
  revalidatePath("/zugang");
}
