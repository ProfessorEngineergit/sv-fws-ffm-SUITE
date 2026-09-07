// Best-effort audit trail for privileged mutations. Writing the log must never
// break the action that triggered it, so every failure is swallowed.
import { prisma } from "@sv/db";

export async function audit(
  actorId: string | null | undefined,
  action: string,
  target?: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        target: target ?? null,
        meta: meta ? (meta as object) : undefined,
      },
    });
  } catch (e) {
    console.warn("[audit] write failed:", (e as Error).message);
  }
}
