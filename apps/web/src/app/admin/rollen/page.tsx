import { prisma } from "@sv/db";
import RolesEditor from "./RolesEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rollen · Admin" };

export default async function AdminRollen() {
  const roles = await prisma.roleAssignment.findMany({ orderBy: { order: "asc" } });
  const items = roles.map((r) => ({
    id: r.id,
    role: r.role,
    name: r.name,
    email: r.email,
    slackId: r.slackId,
    order: r.order,
  }));

  return (
    <div>
      <p className="eyebrow">Wissensbasis</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Rollen & Ämter</h1>
      <p className="mt-2 text-[var(--muted)] max-w-[62ch]">
        Wer welches Amt innehat. Diese Zuordnung steuert auch das smarte
        Mail-Routing – z.&nbsp;B. gehen Finanz-Mails automatisch an den Kassenwart.
        Die Slack-ID (optional) ermöglicht direkte Benachrichtigungen.
      </p>
      <div className="mt-6">
        <RolesEditor roles={items} />
      </div>
    </div>
  );
}
