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

type CreateCompanyInput = {
  ownerId: string;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  stripeCustomerId?: string | null;
  plan?: CompanyPlan;
  subscriptionStatus?: CompanySubscriptionStatus;
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
        input.primaryColor || null,
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

  const [fallbackRows] = await query<CompanyRecord>(
    `SELECT * FROM companies ORDER BY created_at ASC LIMIT 1`,
  );

  return fallbackRows[0] || null;
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
