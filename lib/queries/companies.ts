import { getConnection, query } from "@/lib/db";
import { buildSlugCandidates, slugify } from "@/lib/slug";
import { v4 as uuidv4 } from "uuid";

export type CompanySubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type CompanyPlan = "basic" | "pro" | "enterprise";

export type CompanyRole = "owner" | "admin" | "viewer";

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  owner_id: string;
  stripe_customer_id: string | null;
  subscription_status: CompanySubscriptionStatus;
  plan: CompanyPlan;
  created_at: string;
  updated_at: string;
}

export interface CompanyMemberRecord {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  created_at: string;
  updated_at: string;
}

export interface CompanyMemberWithUserRecord extends CompanyMemberRecord {
  user_email: string;
  user_name: string | null;
}

type CreateCompanyInput = {
  ownerId: string;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  stripeCustomerId?: string | null;
  plan?: CompanyPlan;
  subscriptionStatus?: CompanySubscriptionStatus;
};

type UpdateCompanyProfileInput = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
};

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const normalizedSlug = slugify(slug);
  const [rows] = await query<{ id: string }>(
    `SELECT id FROM companies WHERE slug = ? LIMIT 1`,
    [normalizedSlug],
  );
  return rows.length === 0;
}

export async function generateUniqueCompanySlug(
  companyName: string,
): Promise<string> {
  const candidates = buildSlugCandidates(companyName, 40);

  for (const candidate of candidates) {
    const available = await isSlugAvailable(candidate);
    if (available) return candidate;
  }

  return `${slugify(companyName)}-${Date.now()}`;
}

export async function getCompanyBySlug(
  slug: string,
): Promise<CompanyRecord | null> {
  const normalizedSlug = slugify(slug);
  const [rows] = await query<CompanyRecord>(
    `SELECT * FROM companies WHERE slug = ? LIMIT 1`,
    [normalizedSlug],
  );

  return rows[0] || null;
}

export async function getCompanyById(
  companyId: string,
): Promise<CompanyRecord | null> {
  const [rows] = await query<CompanyRecord>(
    `SELECT * FROM companies WHERE id = ? LIMIT 1`,
    [companyId],
  );

  return rows[0] || null;
}

export async function createCompanyWithOwner(
  input: CreateCompanyInput,
): Promise<CompanyRecord> {
  const connection = await getConnection();
  let companyId = "";

  try {
    await connection.beginTransaction();

    companyId = uuidv4();
    const memberId = uuidv4();
    const slug = input.slug
      ? slugify(input.slug)
      : await generateUniqueCompanySlug(input.name);

    await connection.execute(
      `
      INSERT INTO companies (
        id,
        name,
        slug,
        description,
        logo_url,
        primary_color,
        owner_id,
        stripe_customer_id,
        subscription_status,
        plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        companyId,
        input.name.trim(),
        slug,
        input.description || null,
        input.logoUrl || null,
        null,
        input.ownerId,
        input.stripeCustomerId || null,
        input.subscriptionStatus || "trialing",
        input.plan || "basic",
      ],
    );

    await connection.execute(
      `
      INSERT INTO company_members (id, company_id, user_id, role)
      VALUES (?, ?, ?, 'owner')
      `,
      [memberId, companyId, input.ownerId],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const created = await getCompanyById(companyId);
  if (!created) {
    throw new Error("Empresa criada mas não encontrada");
  }

  return created;
}

export async function listUserCompanies(
  userId: string,
): Promise<Array<CompanyRecord & { role: CompanyRole }>> {
  const [rows] = await query<CompanyRecord & { role: CompanyRole }>(
    `
    SELECT c.*, cm.role
    FROM company_members cm
    JOIN companies c ON c.id = cm.company_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return rows as Array<CompanyRecord & { role: CompanyRole }>;
}

export async function getUserCompanyRole(
  userId: string,
  companyId: string,
): Promise<CompanyRole | null> {
  const [rows] = await query<{ role: CompanyRole }>(
    `
    SELECT role
    FROM company_members
    WHERE user_id = ? AND company_id = ?
    LIMIT 1
    `,
    [userId, companyId],
  );

  return rows[0]?.role || null;
}

export async function isUserCompanyMember(
  userId: string,
  companyId: string,
): Promise<boolean> {
  return (await getUserCompanyRole(userId, companyId)) !== null;
}

export async function resolveDefaultCompanyForUser(
  userIdentifier: string,
  userEmail?: string,
): Promise<CompanyRecord | null> {
  const normalized = String(userIdentifier || "").trim();
  const normalizedEmail = String(userEmail || "")
    .trim()
    .toLowerCase();
  if (!normalized && !normalizedEmail) return null;

  const [membershipRows] = await query<CompanyRecord>(
    `
    SELECT c.*
    FROM company_members cm
    JOIN companies c ON c.id = cm.company_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at ASC
    LIMIT 1
    `,
    [normalized || "__no_user_id__"],
  );

  if (membershipRows[0]) return membershipRows[0];

  const [ownerRows] = await query<CompanyRecord>(
    `
    SELECT *
    FROM companies
    WHERE owner_id = ?
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [normalized || "__no_user_id__"],
  );

  if (ownerRows[0]) return ownerRows[0];

  if (normalizedEmail) {
    const [ownerByEmailRows] = await query<CompanyRecord>(
      `
      SELECT c.*
      FROM companies c
      JOIN users u ON u.id = c.owner_id
      WHERE LOWER(u.email) = ?
      ORDER BY c.created_at ASC
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (ownerByEmailRows[0]) return ownerByEmailRows[0];

    const [memberByEmailRows] = await query<CompanyRecord>(
      `
      SELECT c.*
      FROM company_members cm
      JOIN companies c ON c.id = cm.company_id
      JOIN users u ON u.id = cm.user_id
      WHERE LOWER(u.email) = ?
      ORDER BY c.created_at ASC
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (memberByEmailRows[0]) return memberByEmailRows[0];
  }

  return null;
}

export async function getCompanyMembershipBySlug(
  userId: string,
  slug: string,
): Promise<{ company: CompanyRecord; role: CompanyRole } | null> {
  const normalizedUserId = String(userId || "").trim();
  const normalizedSlug = slugify(slug);
  if (!normalizedUserId || !normalizedSlug) {
    return null;
  }

  const [rows] = await query<(CompanyRecord & { role: CompanyRole })>(
    `
    SELECT c.*, cm.role
    FROM company_members cm
    JOIN companies c ON c.id = cm.company_id
    WHERE cm.user_id = ? AND c.slug = ?
    LIMIT 1
    `,
    [normalizedUserId, normalizedSlug],
  );

  const membership = rows[0] as (CompanyRecord & { role: CompanyRole }) | undefined;
  if (!membership) {
    return null;
  }

  const { role, ...company } = membership;

  return {
    company,
    role,
  };
}

export async function updateCompanyProfile(
  companyId: string,
  input: UpdateCompanyProfileInput,
): Promise<CompanyRecord | null> {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) {
    return null;
  }

  await query(
    `
    UPDATE companies
    SET
      name = ?,
      description = ?,
      logo_url = ?
    WHERE id = ?
    `,
    [
      String(input.name || "").trim(),
      input.description ?? null,
      input.logoUrl ?? null,
      normalizedCompanyId,
    ],
  );

  return await getCompanyById(normalizedCompanyId);
}

export async function listCompanyMembers(
  companyId: string,
): Promise<CompanyMemberWithUserRecord[]> {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) return [];

  const [rows] = await query<CompanyMemberWithUserRecord>(
    `
    SELECT
      cm.id,
      cm.company_id,
      cm.user_id,
      cm.role,
      cm.created_at,
      cm.updated_at,
      u.email AS user_email,
      u.name AS user_name
    FROM company_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.company_id = ?
    ORDER BY
      CASE cm.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END,
      u.email ASC
    `,
    [normalizedCompanyId],
  );

  return rows;
}

export async function getCompanyMemberById(
  memberId: string,
  companyId: string,
): Promise<CompanyMemberWithUserRecord | null> {
  const normalizedMemberId = String(memberId || "").trim();
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedMemberId || !normalizedCompanyId) return null;

  const [rows] = await query<CompanyMemberWithUserRecord>(
    `
    SELECT
      cm.id,
      cm.company_id,
      cm.user_id,
      cm.role,
      cm.created_at,
      cm.updated_at,
      u.email AS user_email,
      u.name AS user_name
    FROM company_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.id = ? AND cm.company_id = ?
    LIMIT 1
    `,
    [normalizedMemberId, normalizedCompanyId],
  );

  return rows[0] || null;
}

export async function getCompanyMemberByUserId(
  userId: string,
  companyId: string,
): Promise<CompanyMemberRecord | null> {
  const normalizedUserId = String(userId || "").trim();
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedUserId || !normalizedCompanyId) return null;

  const [rows] = await query<CompanyMemberRecord>(
    `
    SELECT *
    FROM company_members
    WHERE user_id = ? AND company_id = ?
    LIMIT 1
    `,
    [normalizedUserId, normalizedCompanyId],
  );

  return rows[0] || null;
}

export async function addCompanyMember(input: {
  companyId: string;
  userId: string;
  role: Exclude<CompanyRole, "owner">;
}): Promise<CompanyMemberRecord> {
  const companyId = String(input.companyId || "").trim();
  const userId = String(input.userId || "").trim();
  const role = input.role === "admin" ? "admin" : "viewer";

  if (!companyId || !userId) {
    throw new Error("Parâmetros inválidos para adicionar membro");
  }

  const existing = await getCompanyMemberByUserId(userId, companyId);
  if (existing) {
    return existing;
  }

  const id = uuidv4();
  await query(
    `
    INSERT INTO company_members (id, company_id, user_id, role)
    VALUES (?, ?, ?, ?)
    `,
    [id, companyId, userId, role],
  );

  const created = await getCompanyMemberByUserId(userId, companyId);
  if (!created) {
    throw new Error("Membro criado mas não encontrado");
  }

  return created;
}

export async function updateCompanyMemberRole(input: {
  memberId: string;
  companyId: string;
  role: Exclude<CompanyRole, "owner">;
}): Promise<CompanyMemberRecord | null> {
  const memberId = String(input.memberId || "").trim();
  const companyId = String(input.companyId || "").trim();
  const role = input.role === "admin" ? "admin" : "viewer";
  if (!memberId || !companyId) return null;

  await query(
    `
    UPDATE company_members
    SET role = ?
    WHERE id = ? AND company_id = ?
    `,
    [role, memberId, companyId],
  );

  const [rows] = await query<CompanyMemberRecord>(
    `
    SELECT *
    FROM company_members
    WHERE id = ? AND company_id = ?
    LIMIT 1
    `,
    [memberId, companyId],
  );

  return rows[0] || null;
}

export async function deleteCompanyMember(
  memberId: string,
  companyId: string,
): Promise<boolean> {
  const normalizedMemberId = String(memberId || "").trim();
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedMemberId || !normalizedCompanyId) return false;

  const existing = await getCompanyMemberById(
    normalizedMemberId,
    normalizedCompanyId,
  );
  if (!existing) return false;

  await query(
    `
    DELETE FROM company_members
    WHERE id = ? AND company_id = ?
    `,
    [normalizedMemberId, normalizedCompanyId],
  );

  return true;
}
