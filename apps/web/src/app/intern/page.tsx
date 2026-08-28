import Link from "next/link";
import { CalendarClock, ListTodo, Inbox } from "lucide-react";
import { prisma } from "@sv/db";
import { formatDateTimeDE } from "@/lib/format";
import { getCurrentUser, getCapabilities } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "SV-intern" };

export default async function InternHome() {
  const user = await getCurrentUser();
  const caps = user ? await getCapabilities(user.id, user.role) : [];
  const canMails = caps.includes("mails");

  const [nextEvent, openTasks, openMails] = await Promise.all([
    prisma.event.findFirst({ where: { start: { gte: new Date() } }, orderBy: { start: "asc" } }),
    prisma.task.findMany({ where: { completed: false }, orderBy: { dueDate: "asc" }, take: 5 }),
    canMails
      ? prisma.mail.findMany({
          where: { status: { in: ["new", "notified"] } },
          orderBy: { receivedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([] as { id: string; subject: string | null }[]),
  ]);

  return (
    <div>
      <p className="eyebrow">Interner Bereich</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Übersicht</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="paper-card p-6">
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <CalendarClock size={16} />
            <span className="eyebrow">Nächste SV-Stunde</span>
          </div>
          {nextEvent ? (
            <>
              <div className="mt-3 text-lg font-semibold">{nextEvent.title}</div>
              <div className="text-sm text-[var(--muted)]">{formatDateTimeDE(nextEvent.start)}</div>
            </>
          ) : (
            <p className="mt-3 text-[var(--muted)]">Kein Termin geplant.</p>
          )}
          <Link href="/intern/kalender" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
            Kalender ansehen →
          </Link>
        </div>

        <div className="paper-card p-6">
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <ListTodo size={16} />
            <span className="eyebrow">Offene Aufgaben</span>
          </div>
          {openTasks.length ? (
            <ul className="mt-3 space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="text-sm flex justify-between gap-2">
                  <span className="truncate">{t.title}</span>
                  <span className="text-[var(--muted)] shrink-0">
                    {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(
                      t.dueDate,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[var(--muted)]">Alles erledigt 🎉</p>
          )}
          <Link href="/intern/aufgaben" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
            Zu den Aufgaben →
          </Link>
        </div>

        {canMails && (
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Inbox size={16} />
              <span className="eyebrow">Unerledigte Mails</span>
            </div>
            {openMails.length ? (
              <ul className="mt-3 space-y-2">
                {openMails.map((m) => (
                  <li key={m.id} className="text-sm truncate">
                    {m.subject ?? "(kein Betreff)"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[var(--muted)]">Keine offenen Mails.</p>
            )}
            <Link href="/intern/mails" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
              Zum Posteingang →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
