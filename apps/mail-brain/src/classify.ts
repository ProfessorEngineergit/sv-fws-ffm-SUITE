import OpenAI from "openai";
import {
  isMailCategory,
  isUrgency,
  type MailCategory,
  type MailClassification,
} from "@sv/core";
import { config } from "./config";

const SYSTEM = `Du bist der Assistent der Schülervertretung (SV) einer Waldorfschule.
Klassifiziere die eingehende E-Mail. Antworte AUSSCHLIESSLICH als JSON-Objekt mit den Feldern:
{
  "category": eine von "Finanzen" | "Veranstaltung" | "Protokoll" | "Sonstiges",
  "summary": genau 3 kurze deutsche Sätze, die den Kern der Mail zusammenfassen,
  "urgency": "hoch" | "normal" | "info",
  "event": null ODER { "title": string, "start": ISO-8601-Datum, "end"?: ISO-8601, "location"?: string }
}
"event" nur setzen, wenn ein konkreter Termin genannt wird.`;

function normalize(p: unknown, subject: string, body: string): MailClassification {
  const o = (p ?? {}) as Record<string, unknown>;
  const category: MailCategory = isMailCategory(o.category) ? o.category : "Sonstiges";
  const urgency = isUrgency(o.urgency) ? o.urgency : "normal";
  const summary =
    typeof o.summary === "string" && o.summary.trim()
      ? o.summary.trim()
      : body.slice(0, 180) || subject;

  let event: MailClassification["event"] = null;
  const e = o.event as Record<string, unknown> | null | undefined;
  if (e && typeof e.title === "string" && typeof e.start === "string") {
    event = {
      title: e.title,
      start: e.start,
      end: typeof e.end === "string" ? e.end : undefined,
      location: typeof e.location === "string" ? e.location : undefined,
    };
  }
  return { category, urgency, summary, event };
}

/** Keyword fallback so the pipeline works even without an OpenAI key. */
function heuristic(subject: string, body: string): MailClassification {
  const t = `${subject} ${body}`.toLowerCase();
  let category: MailCategory = "Sonstiges";
  if (/(rechnung|betrag|geld|kasse|zahlung|spende|budget|euro|€|überweis)/.test(t))
    category = "Finanzen";
  else if (/(veranstalt|fest|termin|event|feier|treffen|sitzung|basar)/.test(t))
    category = "Veranstaltung";
  else if (/(protokoll|niederschrift|tagesordnung)/.test(t)) category = "Protokoll";
  const urgency = /(dringend|sofort|asap|wichtig|frist|eilt)/.test(t) ? "hoch" : "normal";
  const trimmed = body.trim();
  const summary = (trimmed.slice(0, 180) || subject) + (trimmed.length > 180 ? " …" : "");
  return { category, urgency, summary, event: null };
}

export async function classifyMail(
  subject: string,
  body: string,
): Promise<MailClassification> {
  if (config.openaiKey) {
    try {
      const client = new OpenAI({ apiKey: config.openaiKey });
      const res = await client.chat.completions.create({
        model: config.openaiModel,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Betreff: ${subject}\n\n${body.slice(0, 4000)}` },
        ],
      });
      const content = res.choices[0]?.message?.content ?? "{}";
      return normalize(JSON.parse(content), subject, body);
    } catch (e) {
      console.warn("[classify] OpenAI failed, falling back to heuristic:", (e as Error).message);
    }
  }
  return heuristic(subject, body);
}
