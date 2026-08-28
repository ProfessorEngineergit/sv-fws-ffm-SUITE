"use client";

import { useActionState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitTopic, type ActionState } from "@/lib/actions/topics";

const initial: ActionState = { ok: false };

export default function TopicForm() {
  const [state, action, pending] = useActionState(submitTopic, initial);

  if (state.ok) {
    return (
      <div className="paper-card p-8 text-center fade-draw-in">
        <CheckCircle2 className="mx-auto" size={40} style={{ color: "var(--ok)" }} />
        <h2 className="mt-4 text-xl font-semibold">Danke!</h2>
        <p className="mt-2 text-[var(--muted)]">
          Dein Thema ist bei der SV eingegangen und wird in einer der nächsten
          Sitzungen besprochen.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="paper-card p-6 sm:p-8 space-y-5">
      <div>
        <label className="field-label" htmlFor="text">
          Dein Anliegen *
        </label>
        <textarea
          id="text"
          name="text"
          rows={5}
          required
          className="field"
          placeholder="Beschreibe kurz, worum es geht …"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">
            Name (optional)
          </label>
          <input id="name" name="name" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            E-Mail (optional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field"
            placeholder="für Rückfragen"
          />
        </div>
      </div>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-navy">
        <Send size={16} />
        {pending ? "Wird gesendet …" : "Thema einreichen"}
      </button>
    </form>
  );
}
