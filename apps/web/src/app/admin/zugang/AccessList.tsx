"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { grantDriveAccess, rejectDriveAccess } from "@/lib/actions/adminDrive";

type Req = {
  id: string;
  email: string;
  requesterRole: string | null;
  reason: string | null;
  status: string;
  folders: string[];
};

export default function AccessList({ requests }: { requests: Req[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (requests.length === 0)
    return <p className="text-[var(--muted)]">Keine Anfragen.</p>;

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="paper-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                {r.email}
                {r.requesterRole && <span className="badge ml-2">{r.requesterRole}</span>}
              </div>
              <div className="text-sm text-[var(--muted)] mt-1">
                Ordner: {r.folders.join(", ") || "—"}
              </div>
              {r.reason && <p className="text-sm mt-2">{r.reason}</p>}
            </div>
            {r.status === "pending" ? (
              <div className="flex gap-2">
                <button
                  className="btn btn-navy btn-sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await grantDriveAccess(r.id);
                      router.refresh();
                    })
                  }
                >
                  <Check size={14} /> Freigeben
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await rejectDriveAccess(r.id);
                      router.refresh();
                    })
                  }
                >
                  <X size={14} /> Ablehnen
                </button>
              </div>
            ) : (
              <span className={`badge ${r.status === "granted" ? "badge-ok" : "badge-danger"}`}>
                {r.status === "granted" ? "Freigegeben" : "Abgelehnt"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
