"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { acknowledgeMail } from "@/lib/actions/mails";

type Mail = {
  id: string;
  fromAddr: string;
  fromName: string | null;
  subject: string | null;
  summary: string | null;
  category: string | null;
  urgency: string | null;
  status: string;
  receivedAt: string;
  assignedRole: string | null;
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

function urgencyClass(u: string | null) {
  if (u === "hoch") return "badge-danger";
  if (u === "info") return "badge";
  return "badge-navy";
}

export default function MailInbox({ mails }: { mails: Mail[] }) {
  const [filter, setFilter] = useState<"open" | "all" | "done">("open");
  const [tp, start] = useTransition();
  const router = useRouter();

  const shown = mails.filter((m) =>
    filter === "all"
      ? true
      : filter === "open"
        ? ["new", "notified"].includes(m.status)
        : m.status === "done",
  );

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(["open", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? "btn-navy" : "btn-ghost"}`}
          >
            {f === "open" ? "Offen" : f === "all" ? "Alle" : "Erledigt"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-[var(--muted)]">
          {mails.length === 0
            ? "Noch keine Mails. Sobald das smarte Mail-System (mail-brain) mit einem Postfach verbunden ist, erscheinen eingehende Mails hier – kategorisiert und zusammengefasst."
            : "Keine Mails in dieser Ansicht."}
        </p>
      ) : (
        <div className="space-y-3">
          {shown.map((m) => (
            <div key={m.id} className="paper-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.category && <span className="badge badge-navy">{m.category}</span>}
                    {m.urgency && <span className={`badge ${urgencyClass(m.urgency)}`}>{m.urgency}</span>}
                    {m.assignedRole && <span className="badge">→ {m.assignedRole}</span>}
                  </div>
                  <div className="mt-2 font-semibold truncate">
                    {m.subject ?? "(kein Betreff)"}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {m.fromName ? `${m.fromName} · ` : ""}
                    {m.fromAddr} · {fmt(m.receivedAt)}
                  </div>
                  {m.summary && <p className="mt-2 text-sm">{m.summary}</p>}
                </div>
                {m.status !== "done" && (
                  <button
                    className="btn btn-navy btn-sm shrink-0"
                    disabled={tp}
                    onClick={() =>
                      start(async () => {
                        await acknowledgeMail(m.id);
                        router.refresh();
                      })
                    }
                  >
                    <Check size={14} /> Erledigt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
