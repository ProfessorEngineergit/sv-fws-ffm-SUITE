import { getAllEvents } from "@/lib/events";
import TermineAdmin from "./TermineAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termine · Admin" };

export default async function AdminTermine() {
  const events = await getAllEvents();
  const items = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start.toISOString(),
    lessonSlot: e.lessonSlot,
  }));

  return (
    <div>
      <p className="eyebrow">Verwaltung</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Termine</h1>
      <p className="mt-2 text-[var(--muted)]">
        Einzeln anlegen oder im alten <code className="font-mono">termine.txt</code>
        -Format importieren.
      </p>
      <div className="mt-6">
        <TermineAdmin events={items} />
      </div>
    </div>
  );
}
