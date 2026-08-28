import type { NextRequest } from "next/server";
import { prisma } from "@sv/db";
import { auth } from "@/auth";
import { readUpload } from "@/lib/uploads";

// Serves protocol PDFs. Public files are open; INTERNAL files require a session.
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

  // Only PUBLIC files are open; INTERNAL/ARCHIVED require a session.
  if (protocol.status !== "PUBLIC") {
    const session = await auth();
    if (!session?.user) return new Response("Nicht autorisiert", { status: 401 });
  }

  try {
    const buf = await readUpload(rel);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${protocol.slug}.pdf"`,
        "Content-Length": String(buf.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("Datei fehlt", { status: 404 });
  }
}
