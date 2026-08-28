"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  addUser,
  setUserRole,
  setUserPermissions,
  removeUser,
  type ActionState,
} from "@/lib/actions/adminUsers";
import { MEMBER_CAPS, CAP_LABELS, type Capability } from "@/lib/permissions";

type U = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MEMBER";
  permissions: string[];
  isMe: boolean;
};
const initial: ActionState = { ok: false };

function PermCell({ user }: { user: U }) {
  const [tp, start] = useTransition();
  const router = useRouter();
  const [caps, setCaps] = useState<string[]>(user.permissions);

  if (user.role === "ADMIN") {
    return <span className="text-xs text-[var(--muted)]">alle Rechte</span>;
  }

  const toggle = (cap: Capability, on: boolean) => {
    const next = on ? [...new Set([...caps, cap])] : caps.filter((c) => c !== cap);
    setCaps(next);
    start(async () => {
      await setUserPermissions(user.id, next);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {MEMBER_CAPS.map((cap) => (
        <label key={cap} className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={caps.includes(cap)}
            disabled={tp}
            onChange={(e) => toggle(cap, e.target.checked)}
          />
          {CAP_LABELS[cap]}
        </label>
      ))}
    </div>
  );
}

export default function NutzerAdmin({ users }: { users: U[] }) {
  const [state, action, pending] = useActionState(addUser, initial);
  const [tp, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <form
        ref={ref}
        action={action}
        className="paper-card p-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] items-end"
      >
        <div>
          <label className="field-label">E-Mail</label>
          <input name="email" type="email" className="field" required />
        </div>
        <div>
          <label className="field-label">Name (optional)</label>
          <input name="name" className="field" />
        </div>
        <div>
          <label className="field-label">Rolle</label>
          <select name="role" className="field" defaultValue="MEMBER">
            <option value="MEMBER">Mitglied</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button className="btn btn-navy" disabled={pending}>
          <Plus size={16} /> Hinzufügen
        </button>
        {state.error && (
          <p className="text-sm sm:col-span-4" style={{ color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
      </form>

      <div className="paper-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--line-blue)]">
              <th className="p-4 font-medium">E-Mail</th>
              <th className="p-4 font-medium">Rolle</th>
              <th className="p-4 font-medium">Zugriff</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line-blue)] last:border-0 align-top">
                <td className="p-4">
                  <div className="font-medium">
                    {u.email}
                    {u.isMe && <span className="badge ml-2">du</span>}
                  </div>
                  {u.name && <div className="text-[var(--muted)]">{u.name}</div>}
                </td>
                <td className="p-4">
                  <select
                    className="field"
                    style={{ width: "auto", padding: "0.3rem 0.5rem" }}
                    defaultValue={u.role}
                    disabled={tp || u.isMe}
                    onChange={(e) =>
                      start(async () => {
                        await setUserRole(u.id, e.target.value as "ADMIN" | "MEMBER");
                        router.refresh();
                      })
                    }
                  >
                    <option value="MEMBER">Mitglied</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <PermCell user={u} />
                </td>
                <td className="p-4 text-right">
                  {!u.isMe && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={tp}
                      onClick={() => {
                        if (confirm("Nutzer entfernen?"))
                          start(async () => {
                            await removeUser(u.id);
                            router.refresh();
                          });
                      }}
                      aria-label="Entfernen"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
