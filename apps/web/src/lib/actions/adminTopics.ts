"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";

export async function setTopicStatus(id: string, status: string) {
  await requireAdmin();
  await prisma.topicSubmission.update({ where: { id }, data: { status } });
  revalidatePath("/admin/themen");
}

export async function deleteTopic(id: string) {
  await requireAdmin();
  await prisma.topicSubmission.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/themen");
}
