import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getProtocolBySlug } from "@/lib/protocols";
import { formatDateDE } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProtocolBySlug(slug);
  return { title: p?.title ?? "Dokument" };
}

export default async function DokumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProtocolBySlug(slug); // public only on this route
  if (!p) notFound();

  const pdfUrl = `/api/files/${p.filePath}`;

  return (
    <div className="container-page pt-10 pb-16">
      <Link
        href="/archiv"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] no-underline"
      >
        <ArrowLeft size={15} /> Zurück zum Archiv
      </Link>

      <div
        className="mt-6 flex flex-wrap items-end justify-between gap-4 border-l-2 pl-5"
        style={{ borderColor: "var(--ink)" }}
      >
        <div>
          <p className="eyebrow">Protokoll</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-medium tracking-tight">{p.title}</h1>
          <p className="mt-2 text-[var(--muted)] font-mono text-sm">{formatDateDE(p.date)}</p>
        </div>
        <a href={pdfUrl} download className="btn btn-navy">
          <Download size={16} /> PDF herunterladen
        </a>
      </div>

      <div className="mt-8 paper-card overflow-hidden p-0">
        <iframe
          src={pdfUrl}
          title={p.title}
          className="w-full"
          style={{ height: "80vh", border: 0 }}
        />
      </div>
    </div>
  );
}
