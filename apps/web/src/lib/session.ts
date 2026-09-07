import { redirect } from "next/navigation";
import { prisma } from "@sv/db";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/adminEmails";
import { MEMBER_CAPS, type Capability } from "@/lib/permissions";

export interface CurrentUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "ADMIN" | "MEMBER";
  permissions: string[];
}

/**
 * The signed-in user, re-validated against the database on every call.
 *
 * The session is a JWT, so role and permissions inside it are a snapshot from
 * sign-in time. Trusting that snapshot would let a demoted or deleted member
 * keep their privileges until the token expires, so authority is always read
 * fresh from the DB here; the JWT only identifies *who* is asking.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) return null;

  const email = sessionUser.email?.toLowerCase() ?? null;
  const db = sessionUser.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, email: true, name: true, role: true, permissions: true },
      })
    : email
      ? await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, permissions: true },
        })
      : null;

  // The account was removed (or never provisioned) — the token is stale.
  if (!db) return null;

  // Env-based bootstrap admins stay admins even if the DB row lags behind.
  const role = db.role === "ADMIN" || isAdminEmail(db.email) ? "ADMIN" : "MEMBER";

  return {
    id: db.id,
    email: db.email,
    name: db.name,
    role,
    permissions: role === "ADMIN" ? [...MEMBER_CAPS] : db.permissions,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/intern");
  return user;
}

/** Page guard: send users without the capability back to the intern home. */
export async function requirePermission(cap: Capability): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (!user.permissions.includes(cap)) redirect("/intern");
  return user;
}

/**
 * Guards for server actions and route handlers. Unlike the page guards these
 * throw instead of redirecting: an action must fail loudly rather than answer a
 * mutation with a navigation.
 */
export class AuthorizationError extends Error {
  constructor(message = "Nicht berechtigt.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Nicht angemeldet.");
  return user;
}

export async function assertAdmin(): Promise<CurrentUser> {
  const user = await assertUser();
  if (user.role !== "ADMIN") throw new AuthorizationError();
  return user;
}

export async function assertPermission(cap: Capability): Promise<CurrentUser> {
  const user = await assertUser();
  if (user.role === "ADMIN") return user;
  if (!user.permissions.includes(cap)) throw new AuthorizationError();
  return user;
}
