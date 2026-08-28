import ArchiveList from "./ArchiveList";
import { getPublicProtocols } from "@/lib/protocols";

export const dynamic = "force-dynamic";
export const metadata = { title: "Archiv" };

export default async function ArchivPage() {
  const protocols = await getPublicProtocols();
  const items = protocols.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date.toISOString(),
    file: `/api/files/${p.filePath}`,
  }));

  return (
    <div className="container-page pt-14 pb-8">
      <p className="eyebrow">Öffentliches Archiv</p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-medium tracking-tight">Protokolle</h1>
      <p className="mt-3 text-[var(--muted)] max-w-[52ch]">
        Alle öffentlichen Sitzungsprotokolle der Schülervertretung – als PDF zum
        Ansehen und Herunterladen.
      </p>
      <ArchiveList items={items} />
    </div>
  );
}
