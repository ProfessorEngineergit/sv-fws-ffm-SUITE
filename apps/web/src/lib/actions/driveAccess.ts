"use server";

import { z } from "zod";
import { prisma } from "@sv/db";
import { notifyDriveAccessRequest } from "@/lib/slack";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige Google-E-Mail an.").max(254),
  requesterRole: z.enum(["Elternteil", "Lehrer", "extern"]).optional(),
  reason: z.string().trim().max(1000).optional(),
  folderIds: z
    .array(z.string().min(1).max(64))
    .min(1, "Bitte wähle mindestens einen Ordner.")
    .max(50),
});

export type ActionState = { ok: boolean; error?: string };

const TOO_MANY = "Zu viele Anfragen. Bitte versuche es später erneut.";

export async function requestDriveAccess(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Unauthenticated endpoint: throttle before touching the database.
  const ip = await clientIp();
  if (!rateLimit(`drive:ip:${ip}`, 5, 60 * 60_000).ok) return { ok: false, error: TOO_MANY };

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

  if (!rateLimit(`drive:mail:${parsed.data.email}`, 3, 60 * 60_000).ok) {
    return { ok: false, error: TOO_MANY };
  }

  // Requests may only ever name folders that are open to public requests; the
  // IDs arrive from the client and are never trusted as-is.
  const allowed = await prisma.driveFolder.findMany({
    where: { id: { in: parsed.data.folderIds }, isPublicRequestable: true },
    select: { id: true },
  });
  if (allowed.length === 0) {
    return { ok: false, error: "Bitte wähle mindestens einen Ordner." };
  }

  const req = await prisma.driveAccessRequest.create({
    data: {
      email: parsed.data.email,
      requesterRole: parsed.data.requesterRole ?? null,
      reason: parsed.data.reason || null,
      folderIds: allowed.map((f) => f.id),
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
