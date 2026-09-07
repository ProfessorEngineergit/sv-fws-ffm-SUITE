import { requireUser } from "@/lib/session";
import InternHeader from "@/components/InternHeader";

export const dynamic = "force-dynamic";

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // requireUser() already returns the capabilities as they are in the DB now.
  const caps = user.permissions;
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
