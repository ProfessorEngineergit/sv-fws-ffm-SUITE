import { prisma } from "@sv/db";
import { requirePermission } from "@/lib/session";
import MailInbox from "./MailInbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mails" };

export default async function MailsPage() {
  await requirePermission("mails");
  const mails = await prisma.mail.findMany({ orderBy: { receivedAt: "desc" }, take: 200 });
  const items = mails.map((m) => ({
    id: m.id,
    fromAddr: m.fromAddr,
    fromName: m.fromName,
    subject: m.subject,
    summary: m.summary,
    category: m.category,
    urgency: m.urgency,
    status: m.status,
    receivedAt: m.receivedAt.toISOString(),
    assignedRole: m.assignedRole,
  }));

  return (
    <div>
      <p className="eyebrow">Smart Mail</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Posteingang</h1>
      <p className="mt-2 text-[var(--muted)]">
        KI-sortierte Mails an die SV-Adresse. „Erledigt" markiert eine Mail als
        bearbeitet – so geht keine unter.
      </p>
      <div className="mt-6">
        <MailInbox mails={items} />
      </div>
    </div>
  );
}
