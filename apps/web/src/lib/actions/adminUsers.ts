"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertAdmin } from "@/lib/session";
import { MEMBER_CAPS } from "@/lib/permissions";
import { isAdminEmail } from "@/lib/adminEmails";
import { audit } from "@/lib/audit";

export type ActionState = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(64);
const roleSchema = z.enum(["ADMIN", "MEMBER"]);

const newUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(120).optional(),
  role: roleSchema,
});

export async function addUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await assertAdmin();
  const parsed = newUserSchema.safeParse({
    email: String(fd.get("email") ?? ""),
    name: String(fd.get("name") ?? "").trim() || undefined,
    role: String(fd.get("role") ?? "") === "ADMIN" ? "ADMIN" : "MEMBER",
  });
  if (!parsed.success) return { ok: false, error: "Gültige E-Mail nötig." };

  const { email, name, role } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return { ok: false, error: "Nutzer existiert bereits." };
  }
  const created = await prisma.user.create({ data: { email, name: name ?? null, role } });
  await audit(me.id, "user.add", created.id, { email, role });
  revalidatePath("/admin/nutzer");
  return { ok: true };
}

/** Number of accounts that can still administer the platform besides `exceptId`. */
async function otherAdminCount(exceptId: string): Promise<number> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", NOT: { id: exceptId } },
    select: { id: true },
  });
  return admins.length;
}

export async function setUserRole(id: string, role: "ADMIN" | "MEMBER") {
  const me = await assertAdmin();
  const parsedId = idSchema.safeParse(id);
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedId.success || !parsedRole.success) return;

  // Never let an admin drop their own privileges or empty the admin group —
  // that would lock everyone out of /admin.
  if (parsedId.data === me.id) return;
  const target = await prisma.user.findUnique({ where: { id: parsedId.data } });
  if (!target) return;
  if (
    parsedRole.data === "MEMBER" &&
    target.role === "ADMIN" &&
    (await otherAdminCount(target.id)) === 0
  ) {
    return;
  }

  await prisma.user.update({ where: { id: parsedId.data }, data: { role: parsedRole.data } });
  await audit(me.id, "user.role", parsedId.data, { from: target.role, to: parsedRole.data });
  revalidatePath("/admin/nutzer");
}

export async function setUserPermissions(id: string, permissions: string[]) {
  const me = await assertAdmin();
  const parsed = z
    .object({ id: idSchema, permissions: z.array(z.string().max(64)).max(20) })
    .safeParse({ id, permissions });
  if (!parsed.success) return;

  const allowed = parsed.data.permissions.filter((p) =>
    (MEMBER_CAPS as readonly string[]).includes(p),
  );
  await prisma.user
    .update({ where: { id: parsed.data.id }, data: { permissions: [...new Set(allowed)] } })
    .catch(() => {});
  await audit(me.id, "user.permissions", parsed.data.id, { permissions: allowed });
  revalidatePath("/admin/nutzer");
}

export async function removeUser(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  if (me.id === parsed.data) return; // never remove yourself

  const target = await prisma.user.findUnique({ where: { id: parsed.data } });
  if (!target) return;
  // Keep at least one admin, and never delete a bootstrap admin from the UI —
  // they would be recreated on their next login anyway.
  if (isAdminEmail(target.email)) return;
  if (target.role === "ADMIN" && (await otherAdminCount(target.id)) === 0) return;

  await prisma.user.delete({ where: { id: parsed.data } }).catch(() => {});
  await audit(me.id, "user.remove", parsed.data, { email: target.email });
  revalidatePath("/admin/nutzer");
}
