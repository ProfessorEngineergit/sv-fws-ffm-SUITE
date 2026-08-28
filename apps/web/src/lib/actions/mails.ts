"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireUser } from "@/lib/session";

export async function acknowledgeMail(id: string) {
  const me = await requireUser();
  await prisma.mail
    .update({
      where: { id },
      data: { status: "done", acknowledgedById: me.id, acknowledgedAt: new Date() },
    })
    .catch(() => {});
  revalidatePath("/intern/mails");
  revalidatePath("/intern");
}
