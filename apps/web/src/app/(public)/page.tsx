import Link from "next/link";
import {
  Archive,
  CalendarDays,
  MessageSquarePlus,
  FolderLock,
  ArrowRight,
} from "lucide-react";

const cards = [
  {
    href: "/archiv",
    icon: Archive,
    title: "Protokoll-Archiv",
    desc: "Alle öffentlichen SV-Protokolle als PDF – durchsuchbar und chronologisch.",
  },
  {
    href: "/termine",
    icon: CalendarDays,
    title: "Termine",
    desc: "Kommende SV-Stunden, als Kalender abonnierbar in Apple & Google Kalender.",
  },
  {
    href: "/themen-einreichen",
    icon: MessageSquarePlus,
    title: "Thema einreichen",
    desc: "Bring dein Anliegen unkompliziert in die nächste Sitzung ein.",
  },
  {
    href: "/zugang",
    icon: FolderLock,
    title: "Dokumenten-Zugang",
    desc: "Zugriff auf die geteilten SV-Ordner in Google Drive anfragen.",
  },
];

export default function Home() {
  return (
    <div className="container-page pt-16 pb-8">
      <p className="eyebrow fade-draw-in">
        Schülervertretung · Freie Waldorfschule Frankfurt
      </p>
      <h1
        className="fade-draw-in mt-3 text-4xl sm:text-6xl font-medium leading-[1.05] tracking-tight"
        style={{ maxWidth: "18ch" }}
      >
        Das digitale Zuhause der <span style={{ color: "var(--accent)" }}>SV</span>.
      </h1>
      <p
        className="fade-draw-in mt-5 text-[var(--ink-soft)] text-lg"
        style={{ maxWidth: "54ch" }}
      >
        Öffentliches Archiv, Termine und ein interner Bereich – transparent,
        selbst gehostet, ohne Umwege über Dritte.
      </p>

      <div className="mt-16 grid gap-5 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="paper-card paper-card-hover p-6 flex items-start gap-4 group no-underline"
            >
              <span
                className="icon-tile shrink-0 w-11 h-11"
                style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)" }}
              >
                <Icon size={20} />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{c.title}</span>
                  <ArrowRight
                    size={16}
                    className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  />
                </span>
                <span className="block mt-1 text-sm text-[var(--muted)] leading-relaxed">
                  {c.desc}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
