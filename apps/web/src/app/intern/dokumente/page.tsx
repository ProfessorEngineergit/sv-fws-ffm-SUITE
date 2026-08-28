import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { prisma } from "@sv/db";
import { formatDateDE } from "@/lib/format";
import { requirePermission } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Interne Dokumente" };

export default async function InternDokumente() {
  await requirePermission("dokumente");
  const docs = await prisma.protocol.findMany({
    where: { status: "INTERNAL" },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <p className="eyebrow">Interner Bereich</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Interne Dokumente</h1>
      <p className="mt-2 text-[var(--muted)]">
        Nur für SV-Mitglieder sichtbar. Öffentliche Protokolle findest du im{" "}
        <Link href="/archiv" className="underline" style={{ color: "var(--accent)" }}>
          Archiv
        </Link>
        .
      </p>

      <div className="mt-6 grid gap-3">
        {docs.length === 0 && (
          <p className="text-[var(--muted)]">
            Noch keine internen Dokumente. Im Admin-Bereich kannst du Protokolle als
            „intern" markieren.
          </p>
        )}
        {docs.map((d) => (
          <a
            key={d.id}
            href={`/api/files/${d.filePath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-card paper-card-hover px-5 py-4 flex items-center gap-4 no-underline"
          >
            <span
              className="grid place-items-center w-10 h-10 rounded-[var(--radius-md)] shrink-0"
              style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}
            >
              <FileText size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold truncate">{d.title}</span>
              <span className="block text-sm text-[var(--muted)]">{formatDateDE(d.date)}</span>
            </span>
            <Lock size={14} className="text-[var(--faint)] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
