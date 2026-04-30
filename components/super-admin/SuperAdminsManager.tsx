"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type SuperAdminItem = {
  id: string;
  email: string;
  name: string;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
};

type Props = {
  initialAdmins: SuperAdminItem[];
};

export default function SuperAdminsManager({ initialAdmins }: Props) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const response = await fetch(withBasePath("/api/super-admin/admins"), { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setAdmins(data.admins || []);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch(withBasePath("/api/super-admin/admins"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(String(data?.error || "Falha ao criar super admin"));
      setLoading(false);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    await refresh();
    router.refresh();
    setLoading(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    setError("");
    const response = await fetch(withBasePath("/api/super-admin/admins"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(String(data?.error || "Falha ao atualizar estado"));
      return;
    }
    await refresh();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="card grid gap-3 p-4 md:grid-cols-4">
        <input className="input-base" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input-base" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input-base" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? "A criar..." : "Criar super admin"}</button>
      </form>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="card overflow-x-auto p-4">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--c-border)] text-xs uppercase tracking-[0.08em] text-gray-500">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Last login</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-[var(--c-border)]/60">
                <td className="px-2 py-2">{admin.name}</td>
                <td className="px-2 py-2">{admin.email}</td>
                <td className="px-2 py-2">{admin.is_active ? "active" : "inactive"}</td>
                <td className="px-2 py-2">{admin.last_login_at || "-"}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(admin.id, Boolean(admin.is_active))}
                    className="rounded-lg border border-[var(--c-border)] px-2 py-1 text-xs"
                  >
                    {admin.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
