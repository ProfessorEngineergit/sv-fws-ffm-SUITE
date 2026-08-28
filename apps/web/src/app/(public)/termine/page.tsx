import { CalendarPlus } from "lucide-react";
import { getUpcomingEvents } from "@/lib/events";
import { formatDateTimeDE } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termine" };

const monthShort = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { month: "short" }).format(d).replace(".", "");

export default async function TerminePage() {
  const events = await getUpcomingEvents();

  return (
    <div className="container-page pt-14 pb-8">
      <p className="eyebrow">Termine</p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-medium tracking-tight">
        Kommende SV-Stunden
      </h1>
      <p className="mt-3 text-[var(--muted)] max-w-[52ch]">
        Alle anstehenden Sitzungen der Schülervertretung. Abonniere den Kalender,
        um sie automatisch in Apple oder Google Kalender zu sehen.
      </p>

      <div className="mt-6">
        <a href="/api/calendar.ics" className="btn btn-ghost">
          <CalendarPlus size={16} /> Kalender abonnieren
        </a>
      </div>

      <div className="mt-10 grid gap-3 max-w-2xl">
        {events.length === 0 ? (
          <p className="text-[var(--muted)]">Zurzeit sind keine Termine eingetragen.</p>
        ) : (
          events.map((e) => {
            const start = e.start;
            return (
              <div key={e.id} className="paper-card px-5 py-4 flex items-center gap-5">
                <div className="text-center w-14 shrink-0">
                  <div className="text-2xl font-semibold leading-none" style={{ color: "var(--accent)" }}>
                    {String(start.getDate()).padStart(2, "0")}
                  </div>
                  <div className="font-mono text-xs uppercase tracking-wide text-[var(--muted)] mt-1">
                    {monthShort(start)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="text-sm text-[var(--muted)]">{formatDateTimeDE(start)}</div>
                </div>
                {e.lessonSlot && <span className="badge badge-navy">{e.lessonSlot}</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
