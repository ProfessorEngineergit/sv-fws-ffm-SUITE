import Link from "next/link";
import { prisma } from "@sv/db";
import { CATEGORY_ROLE_MAP, MAIL_CATEGORIES } from "@sv/core";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mail-Routing · Admin" };

export default async function AdminMailRouting() {
  const roles = await prisma.roleAssignment.findMany();
  const byRole = new Map(roles.map((r) => [r.role, r]));

  return (
    <div>
      <p className="eyebrow">Smart Mail</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Mail-Routing</h1>
      <p className="mt-2 text-[var(--muted)] max-w-[64ch]">
        Eingehende Mails an die SV-Adresse werden per KI kategorisiert und
        automatisch an die zuständige Person weitergeleitet. Die Zuordnung
        Kategorie → Amt ist fest hinterlegt; wer welches Amt innehat, pflegst du
        unter{" "}
        <Link href="/admin/rollen" className="underline" style={{ color: "var(--accent)" }}>
          Rollen &amp; Ämter
        </Link>
        .
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MAIL_CATEGORIES.map((cat) => {
          const role = CATEGORY_ROLE_MAP[cat];
          const person = byRole.get(role);
          return (
            <div key={cat} className="paper-card p-5">
              <div className="eyebrow">{cat}</div>
              <div className="mt-2 text-lg">
                → <span className="font-semibold">{role}</span>
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {person
                  ? `${person.name}${person.email ? ` · ${person.email}` : ""}`
                  : "— noch niemand zugeordnet —"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 paper-card p-5 text-sm text-[var(--muted)] leading-relaxed">
        <strong className="text-[var(--ink)]">Eskalation.</strong> Jede Mail wird
        über ihren Lebenszyklus verfolgt: <em>neu → benachrichtigt → gesehen →
        erledigt</em>. Bleibt eine Mail länger als konfiguriert (
        <code className="font-mono">ESCALATION_HOURS</code>) unbeantwortet, wird sie
        an den Schulsprecher eskaliert und taucht in der Tages-Zusammenfassung auf.
        So geht garantiert keine Mail verloren.
      </div>
    </div>
  );
}
