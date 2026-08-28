import { redirect } from "next/navigation";
import { prisma } from "@sv/db";
import { auth } from "@/auth";
import type { Capability } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/intern");
  return user;
}

/** Fresh capability list from the DB (admins get all implicitly). */
export async function getCapabilities(userId: string, role: string): Promise<string[]> {
  if (role === "ADMIN") return ["mails", "dokumente"];
  const db = await prisma.user.findUnique({
    where: { id: userId },
    select: { permissions: true },
  });
  return db?.permissions ?? [];
}

export async function requirePermission(cap: Capability) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  const caps = await getCapabilities(user.id, user.role);
  if (!caps.includes(cap)) redirect("/intern");
  return user;
}
