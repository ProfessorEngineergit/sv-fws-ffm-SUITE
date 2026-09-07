import crypto from "node:crypto";
import ical from "ical-generator";
import { prisma } from "@sv/db";

export const dynamic = "force-dynamic";

/** Constant-time comparison that does not leak the expected length. */
function tokenMatches(provided: string | null): boolean {
  const expected = process.env.CALENDAR_FEED_TOKEN;
  // An unset or placeholder token must never unlock the internal feed.
  if (!expected || expected.length < 16 || expected === "replace-me") return false;
  if (!provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Public iCal feed. Pass ?token=<CALENDAR_FEED_TOKEN> to also include internal events.
export async function GET(req: Request) {
  const includeInternal = tokenMatches(new URL(req.url).searchParams.get("token"));

  const events = await prisma.event.findMany({
    where: includeInternal ? {} : { visibility: "PUBLIC" },
    orderBy: { start: "asc" },
  });

  const cal = ical({
    name: "SV Waldorfschule Frankfurt",
    prodId: { company: "SV-FFM", product: "Kalender", language: "DE" },
    timezone: "Europe/Berlin",
  });

  for (const e of events) {
    cal.createEvent({
      id: e.id,
      start: e.start,
      end: e.end ?? new Date(e.start.getTime() + 45 * 60_000),
      summary: e.title,
      description: e.description ?? undefined,
      location: e.location ?? undefined,
    });
  }

  return new Response(cal.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sv-termine.ics"',
      "X-Content-Type-Options": "nosniff",
      // The token-authenticated variant is per-subscriber, never shared-cacheable.
      "Cache-Control": includeInternal ? "private, no-store" : "public, max-age=300",
    },
  });
}
