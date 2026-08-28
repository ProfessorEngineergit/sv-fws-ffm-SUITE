import { prisma } from "@sv/db";
import { classifyMail } from "./classify";
import { resolveAssignee } from "./route";
import { notifyMail } from "./slack";

export interface IncomingMail {
  messageId: string;
  fromAddr: string;
  fromName?: string | null;
  subject?: string | null;
  receivedAt: Date;
  bodyText: string;
}

export interface IngestResult {
  skipped: boolean;
  id: string;
  category?: string;
  assignedRole?: string;
}

/** The full pipeline for one mail: store → classify → route → calendar → notify. */
export async function ingestMail(m: IncomingMail): Promise<IngestResult> {
  const existing = await prisma.mail.findUnique({ where: { messageId: m.messageId } });
  if (existing) return { skipped: true, id: existing.id };

  let mail = await prisma.mail.create({
    data: {
      messageId: m.messageId,
      fromAddr: m.fromAddr,
      fromName: m.fromName ?? null,
      subject: m.subject ?? null,
      receivedAt: m.receivedAt,
      bodyText: m.bodyText,
      status: "new",
    },
  });

  const cls = await classifyMail(m.subject ?? "", m.bodyText);
  const assignee = await resolveAssignee(cls.category);

  // If the AI extracted a concrete event, add it to the shared calendar.
  let calendarEventId: string | null = null;
  if (cls.event) {
    const start = new Date(cls.event.start);
    if (!Number.isNaN(start.getTime())) {
      try {
        const ev = await prisma.event.create({
          data: {
            title: cls.event.title,
            start,
            end: cls.event.end ? new Date(cls.event.end) : null,
            location: cls.event.location ?? null,
            source: "MAIL",
            sourceMailId: mail.id,
            visibility: "INTERNAL",
          },
        });
        calendarEventId = ev.id;
      } catch {
        /* ignore malformed dates */
      }
    }
  }

  mail = await prisma.mail.update({
    where: { id: mail.id },
    data: {
      category: cls.category,
      summary: cls.summary,
      urgency: cls.urgency,
      assignedRole: assignee.role,
      assignedEmail: assignee.email,
      calendarEventId,
      status: "notified",
    },
  });

  const ts = await notifyMail({
    id: mail.id,
    subject: mail.subject,
    fromAddr: mail.fromAddr,
    category: cls.category,
    urgency: cls.urgency,
    assignedRole: assignee.role,
    assignedSlackId: assignee.slackId,
    summary: cls.summary,
  });
  if (ts) await prisma.mail.update({ where: { id: mail.id }, data: { slackTs: ts } });

  return { skipped: false, id: mail.id, category: cls.category, assignedRole: assignee.role };
}
