import type { NextRequest } from "next/server";
import { prisma } from "@sv/db";
import { getCurrentUser } from "@/lib/session";
import { readUpload } from "@/lib/uploads";

/**
 * Serves protocol PDFs.
 *   PUBLIC             → open to everyone
 *   INTERNAL/ARCHIVED  → members with the "dokumente" capability (admins always)
 *   DELETED / unknown  → 404
 *
 * The path is only ever used to look up a Protocol row; the file is then read
 * through readUpload(), which keeps the resolved path inside UPLOADS_DIR.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const rel = parts.join("/");

  const protocol = await prisma.protocol.findFirst({ where: { filePath: rel } });
  if (!protocol || protocol.status === "DELETED") {
    return new Response("Nicht gefunden", { status: 404 });
  }

  if (protocol.status !== "PUBLIC") {
    const user = await getCurrentUser();
    if (!user) return new Response("Nicht autorisiert", { status: 401 });
    // Same gate as /intern/dokumente — a session alone is not enough.
    if (user.role !== "ADMIN" && !user.permissions.includes("dokumente")) {
      return new Response("Nicht berechtigt", { status: 403 });
    }
  }

  let buf: Buffer;
  try {
    buf = await readUpload(rel);
  } catch {
    return new Response("Datei fehlt", { status: 404 });
  }

  // The filename is derived from the slug, which is already restricted to
  // [a-z0-9-]; strip anything else defensively so no header can be broken.
  const filename = `${protocol.slug.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 100) || "dokument"}.pdf`;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(buf.length),
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      // Public protocols may be cached by the CDN/browser; everything else is
      // per-user and must never land in a shared cache.
      "Cache-Control":
        protocol.status === "PUBLIC" ? "public, max-age=300" : "private, no-store",
    },
  });
}
