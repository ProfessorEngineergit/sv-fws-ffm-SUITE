// Ported from SV-Archiv/src/lib/schedule.ts — parses the "termine.txt" syntax
// ("- Mo 19.01 3.FS") into concrete start/end datetimes. Reused by the seed and
// by the admin "bulk paste" importer.

export interface FSTimeRange {
  start: string; // HH:MM
  end: string; // HH:MM
}

// Fachstunde (lesson slot) -> time range.
export const FS_TIME_MAP: Record<string, FSTimeRange> = {
  HU: { start: "08:00", end: "09:40" },
  "1": { start: "10:00", end: "10:45" },
  "2": { start: "10:50", end: "11:35" },
  "3": { start: "11:55", end: "12:40" },
  "4": { start: "12:45", end: "13:30" },
  "5": { start: "13:30", end: "14:15" },
  "6": { start: "14:15", end: "15:00" },
  "7": { start: "15:00", end: "15:45" },
  "8": { start: "15:45", end: "16:30" },
};

export interface SVStunde {
  date: Date; // start datetime
  endDate: Date; // end datetime
  dateString: string; // "19.01"
  fs: string; // "3.FS"
  rawLine: string;
}

/**
 * Parse one termine line ("- Mo 19.01 3.FS"). Returns null on non-match.
 * `referenceYear` anchors the year; a month earlier than the reference month
 * rolls over to the next year (matches the original behaviour).
 */
export function parseTermineLine(
  line: string,
  referenceYear: number,
  referenceMonth: number = new Date().getMonth() + 1,
): SVStunde | null {
  const regex = /^-\s*\w+\s+(\d{1,2})\.(\d{1,2})\s+(\d+|HU)\.?\s*FS/i;
  const match = line.trim().match(regex);
  if (!match) return null;

  const [, dayStr, monthStr, fsRaw] = match;
  if (!dayStr || !monthStr || !fsRaw) return null;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const fs = fsRaw.toUpperCase() === "HU" ? "HU" : fsRaw;

  let year = referenceYear;
  if (month < referenceMonth) year = referenceYear + 1;

  const timeRange = FS_TIME_MAP[fs];
  if (!timeRange) return null;

  const [sh, sm] = timeRange.start.split(":").map(Number);
  const [eh, em] = timeRange.end.split(":").map(Number);

  const date = new Date(year, month - 1, day, sh, sm, 0);
  const endDate = new Date(year, month - 1, day, eh, em, 0);

  return {
    date,
    endDate,
    dateString: `${dayStr.padStart(2, "0")}.${monthStr.padStart(2, "0")}`,
    fs: `${fs}.FS`,
    rawLine: line.trim(),
  };
}

/** Parse a whole termine.txt file into sorted SVStunden. */
export function parseTermineFile(content: string, referenceYear?: number): SVStunde[] {
  const year = referenceYear ?? new Date().getFullYear();
  const stunden: SVStunde[] = [];
  for (const line of content.split("\n")) {
    const parsed = parseTermineLine(line, year);
    if (parsed) stunden.push(parsed);
  }
  stunden.sort((a, b) => a.date.getTime() - b.date.getTime());
  return stunden;
}

export function isSessionInProgress(s: SVStunde, now: Date = new Date()): boolean {
  return now >= s.date && now < s.endDate;
}

export function getNextSVStunde(stunden: SVStunde[], now: Date = new Date()): SVStunde | null {
  for (const s of stunden) if (s.endDate > now) return s;
  return null;
}

const WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

/** "Montag, 19.01.2026 um 11:55 Uhr (3.FS)" */
export function formatSVStundeDisplay(s: SVStunde): string {
  const wd = WEEKDAYS[s.date.getDay()];
  const d = String(s.date.getDate()).padStart(2, "0");
  const m = String(s.date.getMonth() + 1).padStart(2, "0");
  const y = s.date.getFullYear();
  const hh = String(s.date.getHours()).padStart(2, "0");
  const mm = String(s.date.getMinutes()).padStart(2, "0");
  return `${wd}, ${d}.${m}.${y} um ${hh}:${mm} Uhr (${s.fs})`;
}
