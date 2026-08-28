"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Plus } from "lucide-react";
import { upsertRole, deleteRole } from "@/lib/actions/adminRoles";

type Role = {
  id: string;
  role: string;
  name: string;
  email: string | null;
  slackId: string | null;
  order: number;
};

function Row({ r, onDone }: { r: Partial<Role>; onDone: () => void }) {
  const [role, setRole] = useState(r.role ?? "");
  const [name, setName] = useState(r.name ?? "");
  const [email, setEmail] = useState(r.email ?? "");
  const [slackId, setSlackId] = useState(r.slackId ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="paper-card p-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_0.8fr_auto] items-end">
      <div>
        <label className="field-label">Amt</label>
        <input className="field" value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Name</label>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="field-label">E-Mail</label>
        <input className="field" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Slack-ID</label>
        <input className="field" value={slackId ?? ""} onChange={(e) => setSlackId(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-navy btn-sm"
          disabled={pending || !role || !name}
          onClick={() =>
            start(async () => {
              await upsertRole({ id: r.id, role, name, email, slackId, order: r.order ?? 0 });
              onDone();
              router.refresh();
            })
          }
          aria-label="Speichern"
        >
          <Save size={14} />
        </button>
        {r.id && (
          <button
            className="btn btn-danger btn-sm"
            disabled={pending}
            onClick={() => {
              if (confirm("Rolle löschen?"))
                start(async () => {
                  await deleteRole(r.id!);
                  router.refresh();
                });
            }}
            aria-label="Löschen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RolesEditor({ roles }: { roles: Role[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      {roles.map((r) => (
        <Row key={r.id} r={r} onDone={() => {}} />
      ))}
      {adding ? (
        <Row r={{ order: roles.length }} onDone={() => setAdding(false)} />
      ) : (
        <button className="btn btn-ghost" onClick={() => setAdding(true)}>
          <Plus size={16} /> Amt hinzufügen
        </button>
      )}
    </div>
  );
}
