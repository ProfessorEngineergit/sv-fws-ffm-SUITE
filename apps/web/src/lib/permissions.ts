// Fine-grained member capabilities. Admins implicitly have all of them; members
// are granted individual capabilities in the Nutzer-Admin.

export const MEMBER_CAPS = ["mails", "dokumente"] as const;
export type Capability = (typeof MEMBER_CAPS)[number];

export const CAP_LABELS: Record<Capability, string> = {
  mails: "Mail-Posteingang",
  dokumente: "Interne Dokumente",
};

export function hasCap(
  user: { role: string; permissions?: string[] } | null | undefined,
  cap: Capability,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return (user.permissions ?? []).includes(cap);
}
