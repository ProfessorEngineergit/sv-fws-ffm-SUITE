import Link from "next/link";
import { auth } from "@/auth";

const NAV = [
  { href: "/archiv", label: "Archiv" },
  { href: "/termine", label: "Termine" },
  { href: "/themen-einreichen", label: "Themen" },
  { href: "/zugang", label: "Dokumente" },
];

export default async function PublicHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 glass !rounded-none border-x-0 border-t-0">
      <div
        className="container-page flex items-center justify-between"
        style={{ height: "var(--header-h)" }}
      >
        <Link href="/" className="font-mono font-bold tracking-[0.12em] no-underline">
          SV·FWS·FFM
        </Link>
        <nav className="hidden sm:flex items-center gap-7">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {session?.user ? (
          <Link href="/intern" className="btn btn-navy btn-sm">
            SV-intern
          </Link>
        ) : (
          <Link href="/login" className="btn btn-ghost btn-sm">
            Anmelden
          </Link>
        )}
      </div>
    </header>
  );
}
