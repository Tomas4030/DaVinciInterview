import { query } from "@/lib/db";
import { randomBytes } from "crypto";

export type CompanyInviteRecord = {
  id: string;
  company_id: string;
  email: string;
  role: "admin" | "viewer";
  token: string;
  invited_by_user_id: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

function buildInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export async function createCompanyInvite(input: {
  companyId: string;
  email: string;
  role: "admin" | "viewer";
  invitedByUserId: string;
  expiresInHours?: number;
}): Promise<CompanyInviteRecord> {
  const companyId = String(input.companyId || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const role = input.role === "admin" ? "admin" : "viewer";
  const invitedByUserId = String(input.invitedByUserId || "").trim();
  const expiresInHours = Math.max(1, Math.min(24 * 14, Number(input.expiresInHours || 72)));

  if (!companyId || !email || !invitedByUserId) {
    throw new Error("Dados inválidos para convite");
  }

  const token = buildInviteToken();

  await query(
    `
    INSERT INTO company_invites (
      id, company_id, email, role, token, invited_by_user_id, status, expires_at
    ) VALUES (UUID(), ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? HOUR))
    `,
    [companyId, email, role, token, invitedByUserId, expiresInHours],
  );

  const [rows] = await query<CompanyInviteRecord>(
    `SELECT * FROM company_invites WHERE token = ? LIMIT 1`,
    [token],
  );

  if (!rows[0]) throw new Error("Convite criado mas não encontrado");
  return rows[0];
}

export async function listPendingInvitesByCompany(
  companyId: string,
): Promise<CompanyInviteRecord[]> {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) return [];

  const [rows] = await query<CompanyInviteRecord>(
    `
    SELECT ci.*
    FROM company_invites ci
    LEFT JOIN users u
      ON LOWER(u.email) = LOWER(ci.email)
    LEFT JOIN company_members cm
      ON cm.company_id = ci.company_id
     AND cm.user_id = u.id
    WHERE ci.company_id = ?
      AND ci.status = 'pending'
      AND ci.expires_at > NOW()
      AND cm.id IS NULL
    ORDER BY ci.created_at DESC
    `,
    [normalizedCompanyId],
  );

  return rows;
}

export async function hasPendingInviteForCompanyAndEmail(
  companyId: string,
  email: string,
): Promise<boolean> {
  const normalizedCompanyId = String(companyId || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedCompanyId || !normalizedEmail) return false;

  const [rows] = await query<{ id: string }>(
    `
    SELECT id
    FROM company_invites
    WHERE company_id = ?
      AND LOWER(email) = ?
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1
    `,
    [normalizedCompanyId, normalizedEmail],
  );

  return rows.length > 0;
}

export async function getInviteByToken(
  token: string,
): Promise<CompanyInviteRecord | null> {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return null;

  const [rows] = await query<CompanyInviteRecord>(
    `SELECT * FROM company_invites WHERE token = ? LIMIT 1`,
    [normalizedToken],
  );

  return rows[0] || null;
}

export async function markInviteAccepted(token: string): Promise<void> {
  await query(
    `
    UPDATE company_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE token = ?
    `,
    [String(token || "").trim()],
  );
}

export async function markPendingInvitesAcceptedByCompanyAndEmail(input: {
  companyId: string;
  email: string;
}): Promise<void> {
  const companyId = String(input.companyId || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  if (!companyId || !email) return;

  await query(
    `
    UPDATE company_invites
    SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW())
    WHERE company_id = ?
      AND LOWER(email) = ?
      AND status = 'pending'
    `,
    [companyId, email],
  );
}

export async function cleanupOrphanPendingInvitesByCompany(
  companyId: string,
): Promise<void> {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) return;

  await query(
    `
    UPDATE company_invites ci
    LEFT JOIN users u
      ON LOWER(u.email) = LOWER(ci.email)
    LEFT JOIN company_members cm
      ON cm.company_id = ci.company_id
     AND cm.user_id = u.id
    SET ci.status = 'accepted',
        ci.accepted_at = COALESCE(ci.accepted_at, NOW())
    WHERE ci.company_id = ?
      AND ci.status = 'pending'
      AND cm.id IS NOT NULL
    `,
    [normalizedCompanyId],
  );
}

export async function revokeInviteById(
  inviteId: string,
  companyId: string,
): Promise<void> {
  await query(
    `
    UPDATE company_invites
    SET status = 'revoked'
    WHERE id = ? AND company_id = ? AND status = 'pending'
    `,
    [String(inviteId || "").trim(), String(companyId || "").trim()],
  );
}
