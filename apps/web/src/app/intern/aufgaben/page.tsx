import { prisma } from "@sv/db";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aufgaben" };

export default async function AufgabenPage() {
  const tasks = await prisma.task.findMany({
    where: { completed: false },
    orderBy: { dueDate: "asc" },
  });
  const items = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate.toISOString(),
    progress: t.progress,
    repetitionInterval: t.repetitionInterval,
  }));

  return (
    <div>
      <p className="eyebrow">Interner Bereich</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Aufgaben</h1>
      <div className="mt-6">
        <TasksClient tasks={items} />
      </div>
    </div>
  );
}
