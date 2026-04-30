"use client";

import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function SuperAdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(withBasePath("/api/super-admin/auth/logout"), {
      method: "POST",
    });
    router.push("/super-admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      Logout
    </button>
  );
}
