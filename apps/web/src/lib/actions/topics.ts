"use server";

import { z } from "zod";
import { prisma } from "@sv/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(5, "Bitte beschreibe dein Thema (mind. 5 Zeichen).")
    .max(4000, "Text ist zu lang."),
  name: z.string().trim().max(120).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .email("Ungültige E-Mail-Adresse.")
    .optional()
    .or(z.literal("")),
});

export type ActionState = { ok: boolean; error?: string };

export async function submitTopic(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Public, unauthenticated form — throttle per client before writing.
  const ip = await clientIp();
  if (!rateLimit(`topic:ip:${ip}`, 5, 60 * 60_000).ok) {
    return { ok: false, error: "Zu viele Einreichungen. Bitte versuche es später erneut." };
  }

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
