import { prisma } from "@sv/db";
import ZugangForm from "./ZugangForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dokumenten-Zugang" };

export default async function ZugangPage() {
  const folders = await prisma.driveFolder.findMany({
    where: { isPublicRequestable: true },
    orderBy: { name: "asc" },
  });
  const items = folders.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
  }));

  return (
    <div className="container-narrow pt-14 pb-16">
      <p className="eyebrow">Dokumenten-Zugang</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">
        Zugriff auf SV-Ordner anfragen
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        Gib deine Google-E-Mail an und wähle die Ordner, die du brauchst. Wir
        schalten dich manuell frei – dein Zugriff läuft dann über dein eigenes
        Google-Konto.
      </p>
      <div className="mt-8">
        <ZugangForm folders={items} />
      </div>
    </div>
  );
}
