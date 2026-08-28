// Shared value/type definitions used across web, mail-brain and the seed.

export const MAIL_CATEGORIES = [
  "Finanzen",
  "Veranstaltung",
  "Protokoll",
  "Sonstiges",
] as const;
export type MailCategory = (typeof MAIL_CATEGORIES)[number];

export const URGENCIES = ["hoch", "normal", "info"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const MAIL_STATUSES = [
  "new",
  "notified",
  "acknowledged",
  "done",
] as const;
export type MailStatus = (typeof MAIL_STATUSES)[number];

export const TOPIC_STATUSES = ["new", "planned", "done", "rejected"] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const ACCESS_STATUSES = ["pending", "granted", "rejected"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

// Structured result the AI classifier must return for each mail.
export interface MailClassification {
  category: MailCategory;
  summary: string; // 3 short German sentences
  urgency: Urgency;
  event?: {
    title: string;
    start: string; // ISO 8601
    end?: string; // ISO 8601
    location?: string;
  } | null;
}

export function isMailCategory(v: unknown): v is MailCategory {
  return typeof v === "string" && (MAIL_CATEGORIES as readonly string[]).includes(v);
}

export function isUrgency(v: unknown): v is Urgency {
  return typeof v === "string" && (URGENCIES as readonly string[]).includes(v);
}
