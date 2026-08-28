import ical from "ical-generator";
import { prisma } from "@sv/db";

export const dynamic = "force-dynamic";

// Public iCal feed. Pass ?token=<CALENDAR_FEED_TOKEN> to also include internal events.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const includeInternal = Boolean(token && token === process.env.CALENDAR_FEED_TOKEN);

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
      "Cache-Control": "public, max-age=300",
    },
  });
}
