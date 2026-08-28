import { requireUser, getCapabilities } from "@/lib/session";
import InternHeader from "@/components/InternHeader";

export const dynamic = "force-dynamic";

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const caps = await getCapabilities(user.id, user.role);
  return (
    <>
      <InternHeader
        role={user.role}
        name={user.name ?? user.email ?? "Mitglied"}
        caps={caps}
      />
      <main className="container-page py-10">{children}</main>
    </>
  );
}
