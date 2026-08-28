import Link from "next/link";
import {
  FileText,
  CalendarDays,
  MessageSquare,
  FolderKey,
  Mail,
  Users2,
} from "lucide-react";
import { prisma } from "@sv/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const [protocols, events, openTopics, pendingAccess, openMails, users] =
    await Promise.all([
      prisma.protocol.count({ where: { status: { not: "DELETED" } } }),
      prisma.event.count({ where: { start: { gte: new Date() } } }),
      prisma.topicSubmission.count({ where: { status: "new" } }),
      prisma.driveAccessRequest.count({ where: { status: "pending" } }),
      prisma.mail.count({ where: { status: { in: ["new", "notified"] } } }),
      prisma.user.count(),
    ]);

  const stats = [
    { label: "Protokolle", value: protocols, href: "/admin/protokolle", icon: FileText },
    { label: "Kommende Termine", value: events, href: "/admin/termine", icon: CalendarDays },
    { label: "Offene Themen", value: openTopics, href: "/admin/themen", icon: MessageSquare },
    { label: "Zugriffs-Anfragen", value: pendingAccess, href: "/admin/zugang", icon: FolderKey },
    { label: "Offene Mails", value: openMails, href: "/admin/mail-routing", icon: Mail },
    { label: "Nutzer", value: users, href: "/admin/nutzer", icon: Users2 },
  ];

  return (
    <div>
      <p className="eyebrow">Verwaltung</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Übersicht</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="paper-card paper-card-hover p-5 no-underline">
              <div className="flex items-center justify-between">
                <span
                  className="grid place-items-center w-10 h-10 rounded-[var(--radius-md)]"
                  style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}
                >
                  <Icon size={18} />
                </span>
                <span className="text-3xl font-semibold">{s.value}</span>
              </div>
              <div className="mt-3 text-sm text-[var(--muted)]">{s.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
