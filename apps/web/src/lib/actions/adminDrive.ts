"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";
import { shareFolderWithUser, driveEnabled } from "@/lib/drive";

export type ActionState = { ok: boolean; error?: string };

export async function grantDriveAccess(id: string) {
  const me = await requireAdmin();
  const req = await prisma.driveAccessRequest.findUnique({ where: { id } });
  if (!req) return;
  const folders = await prisma.driveFolder.findMany({
    where: { id: { in: req.folderIds } },
  });
  if (driveEnabled()) {
    for (const f of folders) {
      try {
        await shareFolderWithUser(f.driveId, req.email);
      } catch (e) {
        console.warn("[drive] share failed:", (e as Error).message);
      }
    }
  }
  await prisma.driveAccessRequest.update({
    where: { id },
    data: { status: "granted", handledById: me.id, handledAt: new Date() },
  });
  revalidatePath("/admin/zugang");
}

export async function rejectDriveAccess(id: string) {
  const me = await requireAdmin();
  await prisma.driveAccessRequest
    .update({
      where: { id },
      data: { status: "rejected", handledById: me.id, handledAt: new Date() },
    })
    .catch(() => {});
  revalidatePath("/admin/zugang");
}

export async function upsertDriveFolder(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const driveId = String(fd.get("driveId") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim() || null;
  if (!name || !driveId) return { ok: false, error: "Name und Drive-Ordner-ID nötig." };
  if (id) {
    await prisma.driveFolder.update({ where: { id }, data: { name, driveId, description } });
  } else {
    await prisma.driveFolder.create({
      data: { name, driveId, description, isPublicRequestable: true },
    });
  }
  revalidatePath("/admin/zugang");
  revalidatePath("/zugang");
  return { ok: true };
}

export async function deleteDriveFolder(id: string) {
  await requireAdmin();
  await prisma.driveFolder.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/zugang");
  revalidatePath("/zugang");
}
