import { CalendarPlus } from "lucide-react";
import { getAllEvents } from "@/lib/events";
import { formatDateTimeDE } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kalender" };

type Ev = Awaited<ReturnType<typeof getAllEvents>>[number];

function Section({ title, list }: { title: string; list: Ev[] }) {
  return (
    <div>
      <h2 className="font-semibold text-lg mt-8 mb-3">{title}</h2>
      {list.length === 0 ? (
        <p className="text-[var(--muted)]">—</p>
      ) : (
        <div className="grid gap-2">
          {list.map((e) => (
            <div
              key={e.id}
              className="paper-card px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-[var(--muted)]">{formatDateTimeDE(e.start)}</div>
              </div>
              {e.lessonSlot && <span className="badge badge-navy">{e.lessonSlot}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function KalenderPage() {
  const events = await getAllEvents();
  const now = new Date();
  const upcoming = events.filter((e) => e.start >= now);
  const past = events.filter((e) => e.start < now).reverse();

  return (
    <div>
      <p className="eyebrow">Interner Bereich</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Kalender</h1>
      <div className="mt-4">
        <a href="/api/calendar.ics" className="btn btn-ghost">
          <CalendarPlus size={16} /> Kalender abonnieren
        </a>
      </div>
      <Section title="Kommende Termine" list={upcoming} />
      <Section title="Vergangene Termine" list={past} />
    </div>
  );
}
