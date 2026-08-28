const asDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d);

export function formatDateDE(d: Date | string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(asDate(d));
}

export function formatDateShortDE(d: Date | string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(asDate(d));
}

export function formatDateTimeDE(d: Date | string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(asDate(d));
}
