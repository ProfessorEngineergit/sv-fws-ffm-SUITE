"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { setProtocolStatus, hardDeleteProtocol, type Status } from "@/lib/actions/adminProtocols";

const OPTS: [Status, string][] = [
  ["PUBLIC", "Öffentlich"],
  ["INTERNAL", "Intern"],
  ["ARCHIVED", "Archiviert"],
  ["DELETED", "Gelöscht"],
];

export default function ProtocolActions({ id, status }: { id: string; status: Status }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setProtocolStatus(id, e.target.value as Status);
            router.refresh();
          })
        }
        className="field"
        style={{ padding: "0.35rem 0.5rem", width: "auto" }}
        aria-label="Status"
      >
        {OPTS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button
        className="btn btn-danger btn-sm"
        disabled={pending}
        onClick={() => {
          if (confirm("Protokoll ENDGÜLTIG löschen (inkl. PDF-Datei)?"))
            start(async () => {
              await hardDeleteProtocol(id);
              router.refresh();
            });
        }}
        title="Endgültig löschen"
        aria-label="Endgültig löschen"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
