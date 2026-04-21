import { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

export const dynamic = "force-dynamic";

export default async function AdminCompanyLayout({ children, params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  if (!session) {
    redirect(`/admin/login?next=/admin/${params.slug}/dashboard`);
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <AdminNav userEmail={session.email} companySlug={membership.company.slug} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
