"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertPermission } from "@/lib/session";

/**
 * Acknowledging a mail is part of the inbox, so it needs the same "mails"
 * capability the /intern/mails page requires — a session alone is not enough.
 */
export async function acknowledgeMail(id: string) {
  const me = await assertPermission("mails");
  const parsed = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success) return;
  await prisma.mail
    .update({
      where: { id: parsed.data },
      data: { status: "done", acknowledgedById: me.id, acknowledgedAt: new Date() },
    })
    .catch(() => {});
  revalidatePath("/intern/mails");
  revalidatePath("/intern");
}
