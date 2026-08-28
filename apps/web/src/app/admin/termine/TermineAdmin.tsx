"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import {
  createEvent,
  bulkImportTermine,
  deleteEvent,
  type ActionState,
} from "@/lib/actions/adminEvents";

type Ev = { id: string; title: string; start: string; lessonSlot: string | null };
const initial: ActionState = { ok: false };

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export default function TermineAdmin({ events }: { events: Ev[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cState, cAction, cPending] = useActionState(createEvent, initial);
  const [bState, bAction, bPending] = useActionState(bulkImportTermine, initial);
  const cRef = useRef<HTMLFormElement>(null);
  const bRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cState.ok) {
      cRef.current?.reset();
      router.refresh();
    }
  }, [cState.ok, router]);
  useEffect(() => {
    if (bState.ok) router.refresh();
  }, [bState.ok, router]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <form ref={cRef} action={cAction} className="paper-card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus size={16} /> Termin anlegen
          </h3>
          <input name="title" placeholder="Titel" className="field" required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Start</label>
              <input name="start" type="datetime-local" className="field" required />
            </div>
            <div>
              <label className="field-label">Ende (optional)</label>
              <input name="end" type="datetime-local" className="field" />
            </div>
          </div>
          <input name="location" placeholder="Ort (optional)" className="field" />
          {cState.error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {cState.error}
            </p>
          )}
          <button className="btn btn-navy" disabled={cPending}>
            {cPending ? "…" : "Anlegen"}
          </button>
        </form>

        <form ref={bRef} action={bAction} className="paper-card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarClock size={16} /> Termine importieren
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Altes Format, eine Zeile pro Termin:{" "}
            <code className="font-mono">- Mo 10.02 5.FS</code>
          </p>
          <textarea
            name="text"
            rows={5}
            className="field font-mono text-sm"
            placeholder={"- Mo 10.02 5.FS\n- Mi 18.02 4.FS"}
          />
          {bState.count != null && (
            <p className="text-sm" style={{ color: "var(--ok)" }}>
              {bState.count} neue Termine importiert.
            </p>
          )}
          <button className="btn btn-ghost" disabled={bPending}>
            {bPending ? "…" : "Importieren"}
          </button>
        </form>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="p-3 font-medium">Termin</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-[var(--muted)]">{fmt(e.start)}</div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Termin löschen?"))
                          start(async () => {
                            await deleteEvent(e.id);
                            router.refresh();
                          });
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-center text-[var(--muted)]">
                    Keine Termine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
