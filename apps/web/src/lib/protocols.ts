import { prisma } from "@sv/db";

/** Publicly listed protocols (status PUBLIC). */
export function getPublicProtocols() {
  return prisma.protocol.findMany({
    where: { status: "PUBLIC" },
    orderBy: { date: "desc" },
  });
}

/** Internal documents for the SV-intern area (status INTERNAL). */
export function getInternalDocuments() {
  return prisma.protocol.findMany({
    where: { status: "INTERNAL" },
    orderBy: { date: "desc" },
  });
}

/** Everything for the admin table, incl. archived and (soft-)deleted. */
export function getAllProtocolsAdmin() {
  return prisma.protocol.findMany({ orderBy: { date: "desc" } });
}

/**
 * Look up a protocol by slug. By default only PUBLIC ones are returned (public
 * detail route); pass allowNonPublic for internal/admin contexts. DELETED is
 * never returned.
 */
export async function getProtocolBySlug(
  slug: string,
  opts: { allowNonPublic?: boolean } = {},
) {
  const p = await prisma.protocol.findUnique({ where: { slug } });
  if (!p || p.status === "DELETED") return null;
  if (p.status !== "PUBLIC" && !opts.allowNonPublic) return null;
  return p;
}
