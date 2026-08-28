"use server";

import { z } from "zod";
import { prisma } from "@sv/db";

const schema = z.object({
  text: z
    .string()
    .min(5, "Bitte beschreibe dein Thema (mind. 5 Zeichen).")
    .max(4000, "Text ist zu lang."),
  name: z.string().max(120).optional(),
  email: z.string().email("Ungültige E-Mail-Adresse.").optional().or(z.literal("")),
});

export type ActionState = { ok: boolean; error?: string };

export async function submitTopic(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse({
    text: formData.get("text"),
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  await prisma.topicSubmission.create({
    data: {
      text: parsed.data.text,
      name: parsed.data.name || null,
      email: parsed.data.email || null,
    },
  });
  return { ok: true };
}
