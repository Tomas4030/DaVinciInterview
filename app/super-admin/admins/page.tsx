import { redirect } from "next/navigation";
import SuperAdminsManager from "@/components/super-admin/SuperAdminsManager";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listSuperAdmins } from "@/lib/queries/super-admins";

export default async function SuperAdminAdminsPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const admins = await listSuperAdmins();

  return (
    <SuperAdminShell active="admins">
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Super Admins</h1>
          <p className="text-sm text-slate-500">Gerir contas de super administradores.</p>
        </header>
        <SuperAdminsManager initialAdmins={admins} />
      </section>
    </SuperAdminShell>
  );
}
