"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { setTopicStatus, deleteTopic } from "@/lib/actions/adminTopics";

type Topic = {
  id: string;
  text: string;
  name: string | null;
  email: string | null;
  status: string;
  createdAt: string;
};

const STATUS: [string, string][] = [
  ["new", "Neu"],
  ["planned", "Geplant"],
  ["done", "Erledigt"],
  ["rejected", "Abgelehnt"],
];

export default function ThemenList({ topics }: { topics: Topic[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (topics.length === 0)
    return <p className="text-[var(--muted)]">Keine eingereichten Themen.</p>;

  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <div key={t.id} className="paper-card p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="flex-1 whitespace-pre-wrap">{t.text}</p>
            <button
              className="btn btn-danger btn-sm shrink-0"
              disabled={pending}
              onClick={() => {
                if (confirm("Thema löschen?"))
                  start(async () => {
                    await deleteTopic(t.id);
                    router.refresh();
                  });
              }}
              aria-label="Löschen"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span>
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                new Date(t.createdAt),
              )}
            </span>
            {t.name && <span>· {t.name}</span>}
            {t.email && <span>· {t.email}</span>}
            <select
              className="field ml-auto"
              style={{ width: "auto", padding: "0.3rem 0.5rem" }}
              defaultValue={t.status}
              disabled={pending}
              onChange={(e) =>
                start(async () => {
                  await setTopicStatus(t.id, e.target.value);
                  router.refresh();
                })
              }
            >
              {STATUS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
