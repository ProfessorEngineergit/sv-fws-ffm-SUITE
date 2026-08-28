"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";

export async function upsertRole(data: {
  id?: string;
  role: string;
  name: string;
  email?: string;
  slackId?: string;
  order?: number;
}) {
  await requireAdmin();
  const payload = {
    role: data.role.trim(),
    name: data.name.trim(),
    email: data.email?.trim() || null,
    slackId: data.slackId?.trim() || null,
    order: data.order ?? 0,
  };
  if (data.id) {
    await prisma.roleAssignment.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.roleAssignment.create({ data: payload });
  }
  revalidatePath("/admin/rollen");
  revalidatePath("/admin/mail-routing");
}

export async function deleteRole(id: string) {
  await requireAdmin();
  await prisma.roleAssignment.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/rollen");
  revalidatePath("/admin/mail-routing");
}
