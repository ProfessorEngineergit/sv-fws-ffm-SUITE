"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  id: z.string().min(1).max(64).optional(),
  role: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().max(254).email().optional().or(z.literal("")),
  // Keep Slack IDs to plain identifier characters so nothing that Slack reads
  // as markup ("<", ">", "!", "@") can end up inside a rendered mention.
  slackId: z
    .string()
    .trim()
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/, "Ungültige Slack-ID.")
    .optional()
    .or(z.literal("")),
  order: z.number().int().min(0).max(9999).optional(),
});

export async function upsertRole(data: {
  id?: string;
  role: string;
  name: string;
  email?: string;
  slackId?: string;
  order?: number;
}) {
  const me = await assertAdmin();
  const parsed = schema.safeParse(data);
  if (!parsed.success) return;

  const payload = {
    role: parsed.data.role,
    name: parsed.data.name,
    email: parsed.data.email || null,
    slackId: parsed.data.slackId || null,
    order: parsed.data.order ?? 0,
  };
  if (parsed.data.id) {
    await prisma.roleAssignment
      .update({ where: { id: parsed.data.id }, data: payload })
      .catch(() => {});
    await audit(me.id, "role.update", parsed.data.id, { role: payload.role });
  } else {
    const created = await prisma.roleAssignment.create({ data: payload });
    await audit(me.id, "role.create", created.id, { role: payload.role });
  }
  revalidatePath("/admin/rollen");
  revalidatePath("/admin/mail-routing");
}

export async function deleteRole(id: string) {
  const me = await assertAdmin();
  const parsed = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success) return;
  await prisma.roleAssignment.delete({ where: { id: parsed.data } }).catch(() => {});
  await audit(me.id, "role.delete", parsed.data);
  revalidatePath("/admin/rollen");
  revalidatePath("/admin/mail-routing");
}
