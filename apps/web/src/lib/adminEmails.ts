// Bootstrap admin whitelist, read from the ADMIN_EMAILS env var. Edge-safe
// (no Node built-ins, no Prisma) so it can be used from middleware.

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
