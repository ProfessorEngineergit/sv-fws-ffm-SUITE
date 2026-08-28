import { getAllProtocolsAdmin } from "@/lib/protocols";
import { formatDateDE } from "@/lib/format";
import UploadForm from "./UploadForm";
import ProtocolActions from "./ProtocolActions";
import type { Status } from "@/lib/actions/adminProtocols";

export const dynamic = "force-dynamic";
export const metadata = { title: "Protokolle · Admin" };

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  PUBLIC: { label: "Öffentlich", cls: "badge-ok" },
  INTERNAL: { label: "Intern", cls: "badge-navy" },
  ARCHIVED: { label: "Archiviert", cls: "badge-warn" },
  DELETED: { label: "Gelöscht", cls: "badge-danger" },
};

export default async function AdminProtokolle() {
  const protocols = await getAllProtocolsAdmin();

  return (
    <div>
      <p className="eyebrow">Verwaltung</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Protokolle</h1>
      <p className="mt-2 text-[var(--muted)]">
        Lade Protokolle als PDF hoch und verschiebe sie zwischen öffentlich,
        intern, archiviert und gelöscht. Titel und Datum werden aus dem Dateinamen
        erkannt.
      </p>

      <div className="mt-6">
        <UploadForm />
      </div>

      <div className="mt-8 paper-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--line-blue)]">
              <th className="p-4 font-medium">Titel</th>
              <th className="p-4 font-medium">Datum</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {protocols.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--line-blue)] last:border-0"
                  style={{ opacity: p.status === "DELETED" ? 0.55 : 1 }}
                >
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 text-[var(--muted)] whitespace-nowrap">
                    {formatDateDE(p.date)}
                  </td>
                  <td className="p-4">
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  </td>
                  <td className="p-4">
                    <ProtocolActions id={p.id} status={p.status} />
                  </td>
                </tr>
              );
            })}
            {protocols.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--muted)]">
                  Noch keine Protokolle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
