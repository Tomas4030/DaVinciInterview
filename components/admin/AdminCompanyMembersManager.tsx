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

type PendingInvite = {
  id: string;
  email: string;
  role: "admin" | "viewer";
  token: string;
  expires_at: string;
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
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");
  const [adding, setAdding] = useState(false);

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

      const invitesResponse = await fetch(withBasePath(`/api/companies/${slug}/invites`), {
        method: "GET",
      });
      const invitesData = await invitesResponse.json();
      if (invitesResponse.ok) {
        setInvites(Array.isArray(invitesData?.invites) ? invitesData.invites : []);
      }
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
      const response = await fetch(withBasePath(`/api/companies/${slug}/invites`), {
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

      const nextInvites = Array.isArray(data?.invites) ? data.invites : [];
      setInvites(nextInvites);
      setNewEmail("");
      setNewRole("viewer");
      setSuccess(tAdmin(locale, "members.inviteSent"));
    } catch (requestError) {
      console.error("Erro ao adicionar membro:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(withBasePath(`/api/companies/${slug}/invites`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || tAdmin(locale, "members.defaultError"));
        return;
      }

      setInvites(Array.isArray(data?.invites) ? data.invites : []);
      setSuccess(tAdmin(locale, "members.inviteRevoked"));
    } catch (requestError) {
      console.error("Erro ao revogar convite:", requestError);
      setError(tAdmin(locale, "members.networkError"));
    }
  }

  async function handleChangeRole(
    member: CompanyMember,
    role: "admin" | "viewer",
  ) {
    if (member.role === "owner") return;

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
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form
        onSubmit={handleAddMember}
        className="grid gap-3 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-bg)]/35 p-3 md:grid-cols-[minmax(0,1fr)_150px_auto] md:items-end"
      >
        <div>
          <label
            htmlFor="member-email"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--c-muted)]"
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
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--c-muted)]"
          >
            {tAdmin(locale, "members.roleLabel")}
          </label>
          <select
            id="member-role"
            value={newRole}
            onChange={(event) =>
              setNewRole(normalizeEditableRole(event.target.value))
            }
            className="input-base h-10 pr-9 text-sm leading-5"
          >
            <option value="admin">{tAdmin(locale, "members.roleAdmin")}</option>
            <option value="viewer">{tAdmin(locale, "members.roleViewer")}</option>
          </select>
        </div>

        <button type="submit" disabled={adding} className="btn-primary inline-flex px-5 py-2.5">
          {adding ? tAdmin(locale, "members.adding") : tAdmin(locale, "members.addAction")}
        </button>
      </form>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-md border border-[var(--c-border)]/50 bg-[var(--c-bg)]/40 px-3 py-3"
            >
              <div className="h-3.5 w-3/4 rounded bg-[var(--c-border)]/70" />
              <div className="h-8 w-full rounded bg-[var(--c-border)]/70" />
            </div>
          ))}
          <p className="pt-1 text-xs text-[var(--c-muted)]">{tAdmin(locale, "members.loading")}</p>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-bg)]/30 px-4 py-8 text-center">
          <p className="text-sm font-medium text-[var(--c-text)]">{tAdmin(locale, "members.empty")}</p>
          <p className="mt-1 text-xs text-[var(--c-muted)]">{tAdmin(locale, "members.emailPlaceholder")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--c-border)]/60 overflow-hidden rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)]">
          {members.map((member) => {
            const isOwner = member.role === "owner";

            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--c-text)]">
                    {member.user_email}
                  </p>
                  {member.user_name ? (
                    <p className="mt-0.5 truncate text-xs text-[var(--c-muted)]">
                      {member.user_name}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-nowrap items-center justify-start gap-2 sm:justify-end">
                  {isOwner ? (
                    <span className="inline-flex rounded-md bg-[var(--c-brand-soft)] px-2 py-1 text-xs font-semibold text-[var(--c-brand-dark)]">
                      {tAdmin(locale, "members.roleOwner")}
                    </span>
                  ) : (
                    <>
                      <select
                        value={normalizeEditableRole(member.role)}
                        onChange={(event) =>
                          handleChangeRole(
                            member,
                            normalizeEditableRole(event.target.value),
                          )
                        }
                        disabled={savingRoleId === member.id || removingId === member.id}
                        className="input-base h-10 min-w-[170px] pr-9 text-sm leading-5"
                      >
                        <option value="admin">{tAdmin(locale, "members.roleAdmin")}</option>
                        <option value="viewer">{tAdmin(locale, "members.roleViewer")}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removingId === member.id || savingRoleId === member.id}
                        className="inline-flex h-10 items-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        {removingId === member.id
                          ? tAdmin(locale, "members.removing")
                          : tAdmin(locale, "members.removeAction")}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">
          {tAdmin(locale, "members.pendingInvites")}
        </p>

        {invites.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--c-muted)]">
            {tAdmin(locale, "members.noPendingInvites")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-[var(--c-border)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--c-text)]">{invite.email}</p>
                  <p className="text-xs text-[var(--c-muted)]">Role: {invite.role}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  {tAdmin(locale, "members.revokeInvite")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
