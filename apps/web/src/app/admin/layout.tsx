import { requireAdmin } from "@/lib/session";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="admin-shell">
      <AdminSidebar userName={user.name ?? user.email ?? "Admin"} />
      <div className="min-w-0 px-6 sm:px-10 py-10">{children}</div>
    </div>
  );
}
