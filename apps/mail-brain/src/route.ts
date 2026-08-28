import { prisma } from "@sv/db";
import { roleForCategory, type MailCategory } from "@sv/core";

export interface Assignee {
  role: string;
  email: string | null;
  slackId: string | null;
  name: string | null;
}

/** Map a category to the responsible role, then look up the current person. */
export async function resolveAssignee(category: MailCategory): Promise<Assignee> {
  const role = roleForCategory(category);
  const person = await prisma.roleAssignment.findFirst({
    where: { role, active: true },
    orderBy: { order: "asc" },
  });
  return {
    role,
    email: person?.email ?? null,
    slackId: person?.slackId ?? null,
    name: person?.name ?? null,
  };
}
