"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { TOPIC_STATUSES } from "@sv/core";
import { assertAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";

const idSchema = z.string().min(1).max(64);
const statusSchema = z.enum(TOPIC_STATUSES);

export async function setTopicStatus(id: string, status: string) {
  const me = await assertAdmin();
  const parsed = z.object({ id: idSchema, status: statusSchema }).safeParse({ id, status });
  if (!parsed.success) return;
  await prisma.topicSubmission
    .update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } })
    .catch(() => {});
  await audit(me.id, "topic.status", parsed.data.id, { status: parsed.data.status });
  revalidatePath("/admin/themen");
}

export async function deleteTopic(id: string) {
  const me = await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  await prisma.topicSubmission.delete({ where: { id: parsed.data } }).catch(() => {});
  await audit(me.id, "topic.delete", parsed.data);
  revalidatePath("/admin/themen");
}
