"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { doSignOut } from "@/lib/actions/auth";

const NAV: { href: string; label: string; cap?: string }[] = [
  { href: "/intern", label: "Übersicht" },
  { href: "/intern/aufgaben", label: "Aufgaben" },
  { href: "/intern/mails", label: "Mails", cap: "mails" },
  { href: "/intern/dokumente", label: "Dokumente", cap: "dokumente" },
  { href: "/intern/kalender", label: "Kalender" },
];

export default function InternHeader({
  role,
  name,
  caps,
}: {
  role: string;
  name: string;
  caps: string[];
}) {
  const path = usePathname();
  const nav = NAV.filter((n) => !n.cap || caps.includes(n.cap));

  return (
    <header className="sticky top-0 z-40 glass !rounded-none border-x-0 border-t-0">
      <div className="container-page flex items-center gap-6" style={{ height: "var(--header-h)" }}>
        <Link href="/intern" className="font-mono font-bold tracking-[0.12em] no-underline">
          SV·INTERN
        </Link>
        <nav className="hidden sm:flex items-center gap-5 flex-1">
          {nav.map((n) => {
            const active = n.href === "/intern" ? path === n.href : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm no-underline transition-colors ${
                  active
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 ml-auto">
          <span className="hidden sm:block text-xs text-[var(--muted)] truncate max-w-[160px]">
            {name}
          </span>
          {role === "ADMIN" && (
            <Link href="/admin" className="btn btn-ghost btn-sm">
              Admin
            </Link>
          )}
          <form action={doSignOut}>
            <button className="btn btn-ghost btn-sm" title="Abmelden" type="submit">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
