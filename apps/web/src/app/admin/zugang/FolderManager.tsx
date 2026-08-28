"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Plus } from "lucide-react";
import {
  upsertDriveFolder,
  deleteDriveFolder,
  type ActionState,
} from "@/lib/actions/adminDrive";

type Folder = { id: string; name: string; driveId: string; description: string | null };
const initial: ActionState = { ok: false };

function FolderForm({ f, onSaved }: { f?: Folder; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(upsertDriveFolder, initial);
  const [delPending, startDel] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (!f) ref.current?.reset();
      onSaved?.();
      router.refresh();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      ref={ref}
      action={action}
      className="paper-card p-4 grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto] items-end"
    >
      {f && <input type="hidden" name="id" value={f.id} />}
      <div>
        <label className="field-label">Name</label>
        <input name="name" className="field" defaultValue={f?.name} required />
      </div>
      <div>
        <label className="field-label">Drive-Ordner-ID</label>
        <input
          name="driveId"
          className="field font-mono text-xs"
          defaultValue={f?.driveId}
          required
        />
      </div>
      <div>
        <label className="field-label">Beschreibung</label>
        <input name="description" className="field" defaultValue={f?.description ?? ""} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-navy btn-sm" disabled={pending} aria-label="Speichern">
          <Save size={14} />
        </button>
        {f && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={delPending}
            onClick={() => {
              if (confirm("Ordner entfernen?"))
                startDel(async () => {
                  await deleteDriveFolder(f.id);
                  router.refresh();
                });
            }}
            aria-label="Entfernen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {state.error && (
        <p className="text-sm sm:col-span-4" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function FolderManager({ folders }: { folders: Folder[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      {folders.map((f) => (
        <FolderForm key={f.id} f={f} />
      ))}
      {adding ? (
        <FolderForm onSaved={() => setAdding(false)} />
      ) : (
        <button className="btn btn-ghost" onClick={() => setAdding(true)}>
          <Plus size={16} /> Ordner hinzufügen
        </button>
      )}
    </div>
  );
}
