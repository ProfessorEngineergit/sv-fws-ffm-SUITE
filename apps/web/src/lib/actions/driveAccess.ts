"use server";

import { z } from "zod";
import { prisma } from "@sv/db";
import { notifyDriveAccessRequest } from "@/lib/slack";

const schema = z.object({
  email: z.string().email("Bitte gib eine gültige Google-E-Mail an."),
  requesterRole: z.enum(["Elternteil", "Lehrer", "extern"]).optional(),
  reason: z.string().max(1000).optional(),
  folderIds: z.array(z.string()).min(1, "Bitte wähle mindestens einen Ordner."),
});

export type ActionState = { ok: boolean; error?: string };

export async function requestDriveAccess(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const folderIds = formData.getAll("folderIds").map(String);
  const roleRaw = formData.get("requesterRole");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    requesterRole: roleRaw ? String(roleRaw) : undefined,
    reason: formData.get("reason") || undefined,
    folderIds,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const req = await prisma.driveAccessRequest.create({
    data: {
      email: parsed.data.email,
      requesterRole: parsed.data.requesterRole ?? null,
      reason: parsed.data.reason || null,
      folderIds: parsed.data.folderIds,
    },
  });

  // Best-effort Slack ping to the admins (no-op if Slack isn't configured).
  try {
    await notifyDriveAccessRequest(req);
  } catch {
    /* ignore */
  }

  return { ok: true };
}
