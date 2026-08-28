// The "knowledge base": which SV role handles which kind of mail, plus the
// default set of roles seeded into the DB. Editable later in the admin panel.

import type { MailCategory } from "./types";

/** Default routing from an AI category to a canonical role name. */
export const CATEGORY_ROLE_MAP: Record<MailCategory, string> = {
  Finanzen: "Kassenwart",
  Veranstaltung: "Veranstaltungsbeauftragter",
  Protokoll: "Schriftführer",
  Sonstiges: "Schulsprecher",
};

/** Role that always receives escalations / anything unrouteable. */
export const FALLBACK_ROLE = "Schulsprecher";

export interface SeedRole {
  role: string;
  name: string;
  email?: string;
  order: number;
}

// Placeholder people — the user fills in real names/emails/Slack IDs in /admin/rollen.
export const DEFAULT_ROLES: SeedRole[] = [
  { role: "Schulsprecher", name: "— noch einzutragen —", order: 0 },
  { role: "Stellv. Schulsprecher", name: "— noch einzutragen —", order: 1 },
  { role: "Kassenwart", name: "— noch einzutragen —", order: 2 },
  { role: "Schriftführer", name: "— noch einzutragen —", order: 3 },
  { role: "Veranstaltungsbeauftragter", name: "— noch einzutragen —", order: 4 },
  { role: "Öffentlichkeitsbeauftragter", name: "— noch einzutragen —", order: 5 },
];

/** Given a category, return the role name that should be notified. */
export function roleForCategory(category: MailCategory | null | undefined): string {
  if (!category) return FALLBACK_ROLE;
  return CATEGORY_ROLE_MAP[category] ?? FALLBACK_ROLE;
}
