import { prisma } from "@sv/db";
import { requireAdmin } from "@/lib/session";
import NutzerAdmin from "./NutzerAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nutzer · Admin" };

export default async function AdminNutzer() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const items = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    permissions: u.permissions,
    isMe: u.id === me.id,
  }));

  return (
    <div>
      <p className="eyebrow">Zugriff</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Nutzer</h1>
      <p className="mt-2 text-[var(--muted)] max-w-[62ch]">
        Nur hier eingetragene E-Mail-Adressen können sich per Google anmelden.
        Admins verwalten alles; Mitglieder sehen den internen Bereich.
      </p>
      <div className="mt-6">
        <NutzerAdmin users={items} />
      </div>
    </div>
  );
}
