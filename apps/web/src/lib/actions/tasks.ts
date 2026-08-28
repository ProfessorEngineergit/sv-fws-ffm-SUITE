"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sv/db";
import { requireUser } from "@/lib/session";

export type ActionState = { ok: boolean; error?: string };

function addInterval(d: Date, interval: string): Date | null {
  const n = new Date(d);
  switch (interval) {
    case "daily":
      n.setDate(n.getDate() + 1);
      return n;
    case "every-2-days":
      n.setDate(n.getDate() + 2);
      return n;
    case "every-3-days":
      n.setDate(n.getDate() + 3);
      return n;
    case "weekly":
      n.setDate(n.getDate() + 7);
      return n;
    case "monthly":
      n.setMonth(n.getMonth() + 1);
      return n;
    default:
      return null;
  }
}

export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const title = String(fd.get("title") ?? "").trim();
  const dueRaw = String(fd.get("dueDate") ?? "");
  const repetitionInterval = String(fd.get("repetitionInterval") ?? "none");
  if (!title) return { ok: false, error: "Titel fehlt." };
  if (!dueRaw) return { ok: false, error: "Fälligkeitsdatum fehlt." };
  await prisma.task.create({
    data: { title, dueDate: new Date(dueRaw), repetitionInterval },
  });
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
  return { ok: true };
}

export async function setTaskProgress(id: string, progress: number) {
  await requireUser();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  const clamped = Math.max(0, Math.min(3, progress));
  const completed = clamped >= 3;

  if (completed && task.repetitionInterval !== "none") {
    // Reschedule instead of completing a recurring task.
    const next = addInterval(task.dueDate, task.repetitionInterval);
    await prisma.task.update({
      where: { id },
      data: { progress: 0, completed: false, dueDate: next ?? task.dueDate },
    });
  } else {
    await prisma.task.update({ where: { id }, data: { progress: clamped, completed } });
  }
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
}

export async function deleteTask(id: string) {
  await requireUser();
  await prisma.task.delete({ where: { id } }).catch(() => {});
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
}
