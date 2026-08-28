import { prisma } from "@sv/db";

export function getUpcomingEvents(limit = 30) {
  return prisma.event.findMany({
    where: { start: { gte: new Date() } },
    orderBy: { start: "asc" },
    take: limit,
  });
}

export function getPublicEvents() {
  return prisma.event.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { start: "asc" },
  });
}

export function getAllEvents() {
  return prisma.event.findMany({ orderBy: { start: "asc" } });
}
