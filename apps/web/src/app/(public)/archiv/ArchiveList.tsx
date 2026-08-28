"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowLeft, Download, X } from "lucide-react";

type Item = { slug: string; title: string; date: string; file?: string };

const PDF_PREVIEW = "#toolbar=0&navpanes=0&scrollbar=0&view=FitH";

const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "numeric" });
const fmtLong = (d: string) =>
  new Date(d).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });

export default function ArchiveList({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [reading, setReading] = useState<Item | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [items],
  );

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      const matchesQ =
        q === "" ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.date.includes(q);
      const d = new Date(p.date);
      const matchFrom = from === "" || d >= new Date(from);
      const matchTo = to === "" || d <= new Date(to);
      return matchesQ && matchFrom && matchTo;
    });
  }, [sorted, q, from, to]);

  const scrollTo = useCallback((where: "start" | "end") => {
    const el = timelineRef.current;
    if (el) el.scrollTo({ left: where === "end" ? el.scrollWidth : 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setReading(null);
    if (reading) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [reading]);

  return (
    <div className="mt-8">
      {/* Reading mode */}
      {reading?.file && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(250,250,248,0.85)", backdropFilter: "blur(24px)" }}>
          <div className="glass-heavy flex items-center justify-between px-5 py-3 mx-4 mt-3">
            <button onClick={() => setReading(null)} className="btn btn-ghost btn-sm">
              <ArrowLeft size={15} /> Zurück
            </button>
            <span className="hidden sm:block font-mono text-sm truncate max-w-xs">{reading.title}</span>
            <a href={reading.file} download className="btn btn-navy btn-sm">
              <Download size={15} /> Download
            </a>
          </div>
          <div className="flex-1 min-h-0 relative m-4 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--line-blue)]">
            <iframe src={reading.file} className="absolute inset-0 w-full h-full" title={reading.title} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Titel oder Datum durchsuchen …"
              className="field pl-9"
              aria-label="Suche"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("timeline")}
              className={`btn btn-sm ${view === "timeline" ? "btn-navy" : "btn-ghost"}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView("table")}
              className={`btn btn-sm ${view === "table" ? "btn-navy" : "btn-ghost"}`}
            >
              Liste
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="field-label">Von</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </div>
          <div>
            <label className="field-label">Bis</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </div>
        </div>
      </div>

      <div className="mt-6 mb-5 flex items-center gap-3">
        <span className="eyebrow">
          {filtered.length} {filtered.length === 1 ? "Protokoll" : "Protokolle"}
        </span>
        <span className="h-px flex-1" style={{ background: "var(--line-blue)" }} />
      </div>

      {filtered.length === 0 && (
        <div className="paper-card px-8 py-16 text-center text-[var(--muted)]">
          Keine Protokolle für die aktuelle Auswahl gefunden.
        </div>
      )}

      {/* Timeline */}
      {view === "timeline" && filtered.length > 0 && (
        <div className="relative">
          <div className="flex justify-between mb-4">
            <button onClick={() => scrollTo("start")} className="btn btn-ghost btn-sm">
              <ChevronLeft size={14} /> Ältestes
            </button>
            <button onClick={() => scrollTo("end")} className="btn btn-ghost btn-sm">
              Aktuelles <ChevronRight size={14} />
            </button>
          </div>
          <div ref={timelineRef} className="overflow-x-auto pb-6 timeline-scroll" style={{ scrollSnapType: "x mandatory" }}>
            <div className="inline-flex gap-5 relative px-10">
              <div
                className="absolute left-0 right-0 h-px timeline-line-fade"
                style={{ top: "28px", background: "var(--line-blue-strong)" }}
              />
              {filtered.map((p) => (
                <div
                  key={p.slug}
                  className="flex-shrink-0 flex flex-col items-center"
                  style={{ scrollSnapAlign: "center", width: "210px" }}
                >
                  <div className="text-center text-xs text-[var(--muted)] mb-2">{fmtShort(p.date)}</div>
                  <div
                    className="h-3 w-3 rounded-full mb-3 relative z-10"
                    style={{ background: "var(--accent)", border: "2px solid var(--paper)" }}
                  />
                  <button
                    onClick={() => setReading(p)}
                    className="paper-card paper-card-hover w-full overflow-hidden cursor-pointer text-left"
                    style={{ aspectRatio: "210 / 297" }}
                  >
                    {p.file ? (
                      <div className="relative h-full overflow-hidden">
                        <iframe
                          src={`${p.file}${PDF_PREVIEW}`}
                          className="w-full h-full pointer-events-none"
                          title={`Vorschau: ${p.title}`}
                          tabIndex={-1}
                          style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%", maxWidth: "none" }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(250,250,248,0.95))" }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--line-blue)]">
                          <h3 className="font-mono text-[11px] leading-tight line-clamp-2">{p.title}</h3>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full p-4">
                        <h3 className="font-mono text-xs text-center line-clamp-3">{p.title}</h3>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {view === "table" && filtered.length > 0 && (
        <div className="space-y-3">
          {[...filtered].reverse().map((p) => (
            <button
              key={p.slug}
              onClick={() => setReading(p)}
              className="paper-card paper-card-hover w-full flex items-center gap-5 py-4 px-4 cursor-pointer text-left"
            >
              {p.file && (
                <div className="hidden sm:block relative h-16 w-12 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line-blue)] flex-shrink-0">
                  <iframe
                    src={`${p.file}${PDF_PREVIEW}`}
                    className="w-full h-full pointer-events-none"
                    title={`Vorschau: ${p.title}`}
                    tabIndex={-1}
                    style={{ transform: "scale(0.3)", transformOrigin: "top left", width: "333%", height: "333%", maxWidth: "none" }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-mono text-base truncate">{p.title}</h2>
                <div className="text-[11px] tracking-wider text-[var(--muted)] uppercase mt-1">
                  {fmtLong(p.date)}
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--faint)] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
