"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users2,
  MessageSquare,
  FolderKey,
  UserCog,
  Mail,
  LogOut,
} from "lucide-react";
import { doSignOut } from "@/lib/actions/auth";

const links = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/admin/protokolle", label: "Protokolle", icon: FileText },
  { href: "/admin/termine", label: "Termine", icon: CalendarDays },
  { href: "/admin/rollen", label: "Rollen & Ämter", icon: Users2 },
  { href: "/admin/themen", label: "Themen", icon: MessageSquare },
  { href: "/admin/zugang", label: "Drive-Zugang", icon: FolderKey },
  { href: "/admin/nutzer", label: "Nutzer", icon: UserCog },
  { href: "/admin/mail-routing", label: "Mail-Routing", icon: Mail },
];

export default function AdminSidebar({ userName }: { userName: string }) {
  const path = usePathname();
  return (
    <aside className="admin-sidebar flex flex-col">
      <Link
        href="/"
        className="font-mono font-bold tracking-[0.12em] no-underline px-2"
      >
        SV·ADMIN
      </Link>
      <nav className="mt-6 flex-1 space-y-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`admin-link ${active ? "active" : ""}`}>
              <Icon size={17} />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 pt-4 border-t border-[var(--line)]">
        <p className="text-xs text-[var(--muted)] px-2 mb-2 truncate">{userName}</p>
        <form action={doSignOut}>
          <button className="admin-link w-full" type="submit">
            <LogOut size={17} />
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}
