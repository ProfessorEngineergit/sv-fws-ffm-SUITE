import { prisma } from "@sv/db";
import ThemenList from "./ThemenList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Themen · Admin" };

export default async function AdminThemen() {
  const topics = await prisma.topicSubmission.findMany({ orderBy: { createdAt: "desc" } });
  const items = topics.map((t) => ({
    id: t.id,
    text: t.text,
    name: t.name,
    email: t.email,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div>
      <p className="eyebrow">Mitbestimmung</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Eingereichte Themen</h1>
      <p className="mt-2 text-[var(--muted)]">Von der öffentlichen Seite eingereichte Anliegen.</p>
      <div className="mt-6">
        <ThemenList topics={items} />
      </div>
    </div>
  );
}
