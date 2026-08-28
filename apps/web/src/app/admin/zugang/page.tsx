import { prisma } from "@sv/db";
import { driveEnabled } from "@/lib/drive";
import AccessList from "./AccessList";
import FolderManager from "./FolderManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Drive-Zugang · Admin" };

export default async function AdminZugang() {
  const [requests, folders] = await Promise.all([
    prisma.driveAccessRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.driveFolder.findMany({ orderBy: { name: "asc" } }),
  ]);
  const folderName = new Map(folders.map((f) => [f.id, f.name]));
  const reqItems = requests.map((r) => ({
    id: r.id,
    email: r.email,
    requesterRole: r.requesterRole,
    reason: r.reason,
    status: r.status,
    folders: r.folderIds.map((id) => folderName.get(id) ?? id),
  }));
  const folderItems = folders.map((f) => ({
    id: f.id,
    name: f.name,
    driveId: f.driveId,
    description: f.description,
  }));

  return (
    <div>
      <p className="eyebrow">Dokumente</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Drive-Zugang</h1>

      {!driveEnabled() && (
        <div
          className="mt-4 paper-card p-4 text-sm"
          style={{ borderColor: "rgba(180,83,9,.35)" }}
        >
          ⚠ Google-Service-Account noch nicht konfiguriert. Freigaben werden erst
          real in Drive gesetzt, sobald{" "}
          <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_JSON</code> hinterlegt
          ist – der Status wird aber schon jetzt gespeichert.
        </div>
      )}

      <h2 className="mt-8 font-semibold text-lg">Anfragen</h2>
      <div className="mt-3">
        <AccessList requests={reqItems} />
      </div>

      <h2 className="mt-10 font-semibold text-lg">Freigebbare Ordner</h2>
      <p className="text-sm text-[var(--muted)] mt-1">
        Trage hier die Google-Drive-Ordner-IDs ein, die über das öffentliche
        Formular angefragt werden können.
      </p>
      <div className="mt-3">
        <FolderManager folders={folderItems} />
      </div>
    </div>
  );
}
