import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminNav from "@/components/admin/AdminNav";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export const dynamic = "force-dynamic"; // Cookies required for auth

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) redirect("/admin/login");

  const company = await resolveDefaultCompanyForUser(session.userId, session.email);
  if (!company) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <AdminNav userEmail={session.email} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
