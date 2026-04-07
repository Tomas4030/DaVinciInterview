import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic"; // Cookies required for auth

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient() as any;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <AdminNav userEmail={session.user?.email ?? ""} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
