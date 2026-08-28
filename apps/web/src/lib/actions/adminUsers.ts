"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";

export type ActionState = { ok: boolean; error?: string };

export async function addUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  const name = String(fd.get("name") ?? "").trim() || null;
  const role = String(fd.get("role")) === "ADMIN" ? "ADMIN" : "MEMBER";
  if (!email.includes("@")) return { ok: false, error: "Gültige E-Mail nötig." };
  if (await prisma.user.findUnique({ where: { email } })) {
    return { ok: false, error: "Nutzer existiert bereits." };
  }
  await prisma.user.create({ data: { email, name, role } });
  revalidatePath("/admin/nutzer");
  return { ok: true };
}

export async function setUserRole(id: string, role: "ADMIN" | "MEMBER") {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/nutzer");
}

export async function setUserPermissions(id: string, permissions: string[]) {
  await requireAdmin();
  const allowed = ["mails", "dokumente"];
  await prisma.user.update({
    where: { id },
    data: { permissions: permissions.filter((p) => allowed.includes(p)) },
  });
  revalidatePath("/admin/nutzer");
}

export async function removeUser(id: string) {
  const me = await requireAdmin();
  if (me.id === id) return; // never remove yourself
  await prisma.user.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/nutzer");
}
