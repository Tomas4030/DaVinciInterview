"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import DataTable from "@/components/super-admin/DataTable";
import StatusBadge from "@/components/super-admin/StatusBadge";

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

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function SuperAdminsManager({ initialAdmins }: Props) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const adminsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;

    return admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q),
    );
  }, [admins, query]);

  async function refresh() {
    const response = await fetch(withBasePath("/api/super-admin/admins"), {
      cache: "no-store",
    });
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
    setShowCreate(false);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar por nome ou email..."
          className="h-11 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none placeholder:text-slate-400"
        />

        <button
          onClick={() => setShowCreate((value) => !value)}
          className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Novo Super Admin
        </button>
      </div>

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] md:grid-cols-4"
        >
          <input
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none"
            placeholder="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          <button
            className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "A criar..." : "Criar"}
          </button>
        </form>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={[
          { key: "name", label: "Nome" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
          { key: "last", label: "Último Login" },
          { key: "actions", label: "Ações", align: "right" },
        ]}
        footer={
          <>
            <span className="text-sm text-slate-500">
              Mostrando {adminsFiltered.length} super admins
            </span>
            <div className="flex items-center gap-2 text-sm">
              <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-400">
                ‹
              </button>
              <button className="rounded-lg bg-indigo-600 px-3 py-1 text-white">
                1
              </button>
              <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-400">
                ›
              </button>
            </div>
          </>
        }
      >
        {adminsFiltered.map((admin) => (
          <tr key={admin.id}>
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {initials(admin.name)}
                </span>
                <span className="font-semibold text-slate-900">
                  {admin.name}
                </span>
              </div>
            </td>
            <td className="px-5 py-4 text-slate-700">{admin.email}</td>
            <td className="px-5 py-4">
              <StatusBadge tone={admin.is_active ? "green" : "red"}>
                {admin.is_active ? "Ativo" : "Inativo"}
              </StatusBadge>
            </td>
            <td className="px-5 py-4 text-slate-700">
              {formatDate(admin.last_login_at)}
            </td>
            <td className="px-5 py-4 text-right">
              <button
                type="button"
                onClick={() => toggleActive(admin.id, Boolean(admin.is_active))}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {admin.is_active ? "Desativar" : "Ativar"}
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
