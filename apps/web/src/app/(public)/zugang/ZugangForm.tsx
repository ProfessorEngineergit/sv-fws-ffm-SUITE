"use client";

import { useActionState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { requestDriveAccess, type ActionState } from "@/lib/actions/driveAccess";

type Folder = { id: string; name: string; description: string | null };

const initial: ActionState = { ok: false };

export default function ZugangForm({ folders }: { folders: Folder[] }) {
  const [state, action, pending] = useActionState(requestDriveAccess, initial);

  if (state.ok) {
    return (
      <div className="paper-card p-8 text-center fade-draw-in">
        <CheckCircle2 className="mx-auto" size={40} style={{ color: "var(--ok)" }} />
        <h2 className="mt-4 text-xl font-semibold">Anfrage gesendet</h2>
        <p className="mt-2 text-[var(--muted)]">
          Wir prüfen deine Anfrage und schalten dich frei. Du bekommst dann eine
          Benachrichtigung von Google Drive per E-Mail.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="paper-card p-6 sm:p-8 space-y-5">
      <div>
        <label className="field-label" htmlFor="email">
          Deine Google-E-Mail *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
          placeholder="name@gmail.com"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="requesterRole">
          Ich bin …
        </label>
        <select id="requesterRole" name="requesterRole" className="field" defaultValue="">
          <option value="">— bitte wählen —</option>
          <option value="Elternteil">Elternteil</option>
          <option value="Lehrer">Lehrer:in</option>
          <option value="extern">extern</option>
        </select>
      </div>

      <fieldset>
        <legend className="field-label">Gewünschte Ordner *</legend>
        <div className="space-y-2">
          {folders.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Zurzeit sind keine Ordner freigegeben.
            </p>
          )}
          {folders.map((f) => (
            <label
              key={f.id}
              className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--line)] hover:border-[var(--accent-soft)] cursor-pointer transition-colors"
            >
              <input type="checkbox" name="folderIds" value={f.id} className="mt-1" />
              <span>
                <span className="font-medium">{f.name}</span>
                {f.description && (
                  <span className="block text-sm text-[var(--muted)]">{f.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="field-label" htmlFor="reason">
          Nachricht (optional)
        </label>
        <textarea id="reason" name="reason" rows={3} className="field" />
      </div>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-navy">
        <Send size={16} />
        {pending ? "Wird gesendet …" : "Zugang anfragen"}
      </button>
    </form>
  );
}
