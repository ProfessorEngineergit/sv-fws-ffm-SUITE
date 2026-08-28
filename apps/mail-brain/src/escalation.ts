import { prisma } from "@sv/db";
import { config } from "./config";
import { notifyMail } from "./slack";

/**
 * Re-notify (escalate) any mail that has sat unacknowledged longer than
 * ESCALATION_HOURS. This is the "no mail is ever ignored" guarantee.
 */
export async function runEscalation(): Promise<number> {
  const cutoff = new Date(Date.now() - config.escalationHours * 3_600_000);
  const stale = await prisma.mail.findMany({
    where: { status: { in: ["new", "notified"] }, receivedAt: { lt: cutoff } },
  });
  for (const m of stale) {
    await notifyMail({
      id: m.id,
      subject: m.subject,
      fromAddr: m.fromAddr,
      category: m.category ?? "Sonstiges",
      urgency: "hoch",
      assignedRole: m.assignedRole ?? "Schulsprecher",
      summary: m.summary ?? "",
      escalated: true,
    });
  }
  return stale.length;
}
