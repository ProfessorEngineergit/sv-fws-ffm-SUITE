"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@sv/db";
import { assertUser } from "@/lib/session";

export type ActionState = { ok: boolean; error?: string };

// Not exported: a "use server" module may only export async functions.
const REPETITION_INTERVALS = [
  "none",
  "daily",
  "every-2-days",
  "every-3-days",
  "weekly",
  "monthly",
] as const;
type Repetition = (typeof REPETITION_INTERVALS)[number];

const idSchema = z.string().min(1).max(64);

const createSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt.").max(200),
  dueDate: z
    .string()
    .min(1, "Fälligkeitsdatum fehlt.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Ungültiges Fälligkeitsdatum."),
  repetitionInterval: z.enum(REPETITION_INTERVALS).catch("none"),
});

function addInterval(d: Date, interval: string): Date | null {
  const n = new Date(d);
  switch (interval as Repetition) {
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
  await assertUser();
  const parsed = createSchema.safeParse({
    title: String(fd.get("title") ?? ""),
    dueDate: String(fd.get("dueDate") ?? ""),
    repetitionInterval: String(fd.get("repetitionInterval") ?? "none"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  await prisma.task.create({
    data: {
      title: parsed.data.title,
      dueDate: new Date(parsed.data.dueDate),
      repetitionInterval: parsed.data.repetitionInterval,
    },
  });
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
  return { ok: true };
}

export async function setTaskProgress(id: string, progress: number) {
  await assertUser();
  const parsed = z
    .object({ id: idSchema, progress: z.number().int().finite() })
    .safeParse({ id, progress });
  if (!parsed.success) return;

  const task = await prisma.task.findUnique({ where: { id: parsed.data.id } });
  if (!task) return;
  const clamped = Math.max(0, Math.min(3, parsed.data.progress));
  const completed = clamped >= 3;

  if (completed && task.repetitionInterval !== "none") {
    // Reschedule instead of completing a recurring task.
    const next = addInterval(task.dueDate, task.repetitionInterval);
    await prisma.task.update({
      where: { id: task.id },
      data: { progress: 0, completed: false, dueDate: next ?? task.dueDate },
    });
  } else {
    await prisma.task.update({
      where: { id: task.id },
      data: { progress: clamped, completed },
    });
  }
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
}

export async function deleteTask(id: string) {
  await assertUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  await prisma.task.delete({ where: { id: parsed.data } }).catch(() => {});
  revalidatePath("/intern/aufgaben");
  revalidatePath("/intern");
}
