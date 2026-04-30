import { redirect } from "next/navigation";
import SuperAdminNav from "@/components/super-admin/SuperAdminNav";
import SuperAdminsManager from "@/components/super-admin/SuperAdminsManager";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listSuperAdmins } from "@/lib/queries/super-admins";

export default async function SuperAdminAdminsPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const admins = await listSuperAdmins();

  return (
    <main className="min-h-screen bg-[var(--c-bg)] p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <SuperAdminNav email={session.email} />
        <section>
          <h1 className="mb-4 text-xl font-semibold text-gray-900">Super admins</h1>
          <SuperAdminsManager initialAdmins={admins} />
        </section>
      </div>
    </main>
  );
}
