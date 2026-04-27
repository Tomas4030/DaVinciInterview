"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";

type CompanyMember = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "viewer";
  user_email: string;
  user_name: string | null;
};

type Props = {
  slug: string;
  locale?: string;
};

function normalizeEditableRole(value: unknown): "admin" | "viewer" {
  return value === "admin" ? "admin" : "viewer";
}

export default function AdminCompanyMembersManager({
  slug,
  locale = "en",
}: Props) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");
  const [adding, setAdding] = useState(false);

  const [pendingRoles, setPendingRoles] = useState<Record<string, "admin" | "viewer">>({});
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(withBasePath(`/api/companies/${slug}/members`), {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "members.defaultError"));
        return;
      }

      const nextMembers = Array.isArray(data?.members) ? data.members : [];
      setMembers(nextMembers);
      const nextPending: Record<string, "admin" | "viewer"> = {};
      for (const member of nextMembers) {
        if (member.role === "owner") continue;
        nextPending[member.id] = normalizeEditableRole(member.role);
      }
      setPendingRoles(nextPending);
    } catch (requestError) {
      console.error("Erro ao carregar membros:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleAddMember(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);

    try {
      const response = await fetch(withBasePath(`/api/companies/${slug}/members`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "members.defaultError"));
        return;
      }

      const nextMembers = Array.isArray(data?.members) ? data.members : [];
      setMembers(nextMembers);
      setNewEmail("");
      setNewRole("viewer");
      setSuccess(tAdmin(locale, "members.added"));
    } catch (requestError) {
      console.error("Erro ao adicionar membro:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveRole(member: CompanyMember) {
    if (member.role === "owner") return;
    const role = normalizeEditableRole(pendingRoles[member.id]);

    setError("");
    setSuccess("");
    setSavingRoleId(member.id);

    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/members/${member.id}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "members.defaultError"));
        return;
      }

      setMembers(Array.isArray(data?.members) ? data.members : []);
      setSuccess(tAdmin(locale, "members.updated"));
    } catch (requestError) {
      console.error("Erro ao atualizar membro:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    } finally {
      setSavingRoleId(null);
    }
  }

  async function handleRemoveMember(member: CompanyMember) {
    setError("");
    setSuccess("");
    setRemovingId(member.id);

    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/members/${member.id}`),
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "members.defaultError"));
        return;
      }

      setMembers(Array.isArray(data?.members) ? data.members : []);
      setSuccess(tAdmin(locale, "members.removed"));
    } catch (requestError) {
      console.error("Erro ao remover membro:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleAddMember} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
        <div>
          <label
            htmlFor="member-email"
            className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
          >
            {tAdmin(locale, "members.emailLabel")}
          </label>
          <input
            id="member-email"
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
            className="input-base"
            placeholder={tAdmin(locale, "members.emailPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="member-role"
            className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
          >
            {tAdmin(locale, "members.roleLabel")}
          </label>
          <select
            id="member-role"
            value={newRole}
            onChange={(event) =>
              setNewRole(normalizeEditableRole(event.target.value))
            }
            className="input-base"
          >
            <option value="admin">{tAdmin(locale, "members.roleAdmin")}</option>
            <option value="viewer">{tAdmin(locale, "members.roleViewer")}</option>
          </select>
        </div>

        <button type="submit" disabled={adding} className="btn-primary inline-flex px-5 py-2.5">
          {adding ? tAdmin(locale, "members.adding") : tAdmin(locale, "members.addAction")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[var(--c-border)]/70">
        <table className="min-w-full divide-y divide-[var(--c-border)]/70 text-sm">
          <thead className="bg-[var(--c-bg)]/70 text-left text-xs uppercase tracking-[0.05em] text-[var(--c-muted)]">
            <tr>
              <th className="px-4 py-3">{tAdmin(locale, "members.tableEmail")}</th>
              <th className="px-4 py-3">{tAdmin(locale, "members.tableRole")}</th>
              <th className="px-4 py-3 text-right">{tAdmin(locale, "members.tableActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-border)]/60 bg-[var(--c-surface)]">
            {loading ? (
              <tr>
                <td className="px-4 py-5 text-[var(--c-muted)]" colSpan={3}>
                  {tAdmin(locale, "members.loading")}
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-[var(--c-muted)]" colSpan={3}>
                  {tAdmin(locale, "members.empty")}
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const isOwner = member.role === "owner";
                const pendingRole = isOwner
                  ? "owner"
                  : normalizeEditableRole(pendingRoles[member.id]);

                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--c-text)]">{member.user_email}</div>
                      {member.user_name ? (
                        <div className="text-xs text-[var(--c-muted)]">{member.user_name}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {isOwner ? (
                        <span className="inline-flex rounded-md bg-[var(--c-brand-soft)] px-2 py-1 text-xs font-semibold text-[var(--c-brand-dark)]">
                          {tAdmin(locale, "members.roleOwner")}
                        </span>
                      ) : (
                        <select
                          value={pendingRole}
                          onChange={(event) =>
                            setPendingRoles((current) => ({
                              ...current,
                              [member.id]: normalizeEditableRole(event.target.value),
                            }))
                          }
                          className="input-base h-9 max-w-[160px]"
                        >
                          <option value="admin">{tAdmin(locale, "members.roleAdmin")}</option>
                          <option value="viewer">{tAdmin(locale, "members.roleViewer")}</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleSaveRole(member)}
                            disabled={savingRoleId === member.id}
                            className="rounded-md border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--c-text)]"
                          >
                            {savingRoleId === member.id
                              ? tAdmin(locale, "members.saving")
                              : tAdmin(locale, "members.saveAction")}
                          </button>
                        ) : null}

                        {!isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            disabled={removingId === member.id}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            {removingId === member.id
                              ? tAdmin(locale, "members.removing")
                              : tAdmin(locale, "members.removeAction")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
