import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import SuperAdminsManager from "@/components/super-admin/SuperAdminsManager";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listSuperAdmins } from "@/lib/queries/super-admins";

export default async function SuperAdminAdminsPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const admins = await listSuperAdmins();

  return (
    <SuperAdminShell active="admins">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Super Admins
          </h1>
          <p className="mt-1 text-sm text-[#787774]">
            Gerir contas de super administradores
          </p>
        </header>

        <SuperAdminsManager initialAdmins={admins} />
      </div>
    </SuperAdminShell>
  );
}
