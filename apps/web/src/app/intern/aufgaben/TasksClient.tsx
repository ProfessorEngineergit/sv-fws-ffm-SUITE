"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { createTask, setTaskProgress, deleteTask, type ActionState } from "@/lib/actions/tasks";

type Task = {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  repetitionInterval: string;
};

const initial: ActionState = { ok: false };
const REP: [string, string][] = [
  ["none", "Keine"],
  ["daily", "Täglich"],
  ["every-2-days", "Alle 2 Tage"],
  ["every-3-days", "Alle 3 Tage"],
  ["weekly", "Wöchentlich"],
  ["monthly", "Monatlich"],
];

export default function TasksClient({ tasks }: { tasks: Task[] }) {
  const [state, action, pending] = useActionState(createTask, initial);
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
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <form ref={ref} action={action} className="paper-card p-5 space-y-3 h-fit">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus size={16} /> Neue Aufgabe
        </h3>
        <input name="title" placeholder="Titel" className="field" required />
        <div>
          <label className="field-label">Fällig bis</label>
          <input name="dueDate" type="date" className="field" required />
        </div>
        <div>
          <label className="field-label">Wiederholung</label>
          <select name="repetitionInterval" className="field" defaultValue="none">
            {REP.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {state.error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
        <button className="btn btn-navy" disabled={pending}>
          {pending ? "…" : "Hinzufügen"}
        </button>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 && <p className="text-[var(--muted)]">Keine offenen Aufgaben.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="paper-card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-[var(--muted)]">
                fällig{" "}
                {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                  new Date(t.dueDate),
                )}
                {t.repetitionInterval !== "none" && " · wiederkehrend"}
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className="h-1.5 w-10 rounded-full"
                    style={{ background: n <= t.progress ? "var(--accent)" : "var(--line)" }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="btn btn-ghost btn-sm"
                disabled={tp}
                onClick={() =>
                  start(async () => {
                    await setTaskProgress(t.id, t.progress + 1);
                    router.refresh();
                  })
                }
                title="Fortschritt +"
              >
                <Check size={14} />
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={tp}
                onClick={() => {
                  if (confirm("Aufgabe löschen?"))
                    start(async () => {
                      await deleteTask(t.id);
                      router.refresh();
                    });
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
