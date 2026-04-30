import "server-only";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type SuperAdminRecord = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function monthStartSql(): string {
  return "DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')";
}

export async function findSuperAdminByEmail(email: string): Promise<SuperAdminRecord | null> {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const [rows] = await query<SuperAdminRecord>(
    `
    SELECT *
    FROM super_admins
    WHERE email = ?
      AND is_active = 1
    LIMIT 1
    `,
    [normalizedEmail],
  );

  return rows[0] || null;
}

export async function touchSuperAdminLastLogin(id: string): Promise<void> {
  await query(
    `
    UPDATE super_admins
    SET last_login_at = NOW()
    WHERE id = ?
    LIMIT 1
    `,
    [id],
  );
}

export async function countActiveSuperAdmins(): Promise<number> {
  const [[row]] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM super_admins WHERE is_active = 1`,
  );
  return Number(row?.total || 0);
}

export async function createSuperAdmin(input: {
  email: string;
  name: string;
  password: string;
  createdBySuperAdminId?: string | null;
}): Promise<SuperAdminRecord> {
  const normalizedEmail = String(input.email || "").trim().toLowerCase();
  const normalizedName = String(input.name || "").trim();
  const passwordHash = hashPassword(input.password);

  await query(
    `
    INSERT INTO super_admins (
      id,
      email,
      name,
      password_hash,
      is_active,
      created_by_super_admin_id,
      created_at,
      updated_at
    ) VALUES (
      UUID(), ?, ?, ?, 1, ?, NOW(), NOW()
    )
    `,
    [normalizedEmail, normalizedName, passwordHash, input.createdBySuperAdminId || null],
  );

  const created = await findSuperAdminByEmail(normalizedEmail);
  if (!created) throw new Error("Falha ao criar super admin");
  return created;
}

export async function listSuperAdmins(): Promise<
  Array<{
    id: string;
    email: string;
    name: string;
    is_active: number;
    last_login_at: string | null;
    created_at: string;
  }>
> {
  const [rows] = await query<{
    id: string;
    email: string;
    name: string;
    is_active: number;
    last_login_at: string | null;
    created_at: string;
  }>(
    `
    SELECT
      id,
      email,
      name,
      is_active,
      CASE WHEN last_login_at IS NULL THEN NULL ELSE DATE_FORMAT(last_login_at, '%Y-%m-%d %H:%i:%s') END AS last_login_at,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM super_admins
    ORDER BY created_at DESC
    `,
  );

  return rows;
}

export async function updateSuperAdminActiveState(id: string, isActive: boolean): Promise<void> {
  if (!isActive) {
    const activeCount = await countActiveSuperAdmins();
    if (activeCount <= 1) {
      throw new Error("Não é possível desativar o último super admin ativo");
    }
  }

  await query(
    `
    UPDATE super_admins
    SET is_active = ?, updated_at = NOW()
    WHERE id = ?
    LIMIT 1
    `,
    [isActive ? 1 : 0, id],
  );
}

export async function getSuperAdminDashboardStats(): Promise<{
  totalCompanies: number;
  activeCompanies: number;
  totalCompanyAdmins: number;
  aiCallsThisMonth: number;
  aiCostThisMonthUsd: number;
  totalTokensThisMonth: number;
}> {
  const [[companies]] = await query<{ total: number; active: number }>(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN subscription_status IN ('active','trialing','past_due') THEN 1 ELSE 0 END) AS active
    FROM companies
    `,
  );

  const [[companyAdmins]] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM company_members WHERE role = 'admin'`,
  );

  const [[usage]] = await query<{ totalCalls: number; totalCost: number; totalTokens: number }>(
    `
    SELECT
      COUNT(*) AS totalCalls,
      COALESCE(SUM(cost_usd), 0) AS totalCost,
      COALESCE(SUM(total_tokens), 0) AS totalTokens
    FROM ai_usage_logs
    WHERE created_at >= ${monthStartSql()}
    `,
  );

  return {
    totalCompanies: Number(companies?.total || 0),
    activeCompanies: Number(companies?.active || 0),
    totalCompanyAdmins: Number(companyAdmins?.total || 0),
    aiCallsThisMonth: Number(usage?.totalCalls || 0),
    aiCostThisMonthUsd: Number(usage?.totalCost || 0),
    totalTokensThisMonth: Number(usage?.totalTokens || 0),
  };
}

export async function getDailyAiCost(): Promise<Array<{ day: string; cost_usd: number }>> {
  const [rows] = await query<{ day: string; cost_usd: number }>(
    `
    SELECT
      DATE_FORMAT(created_at, '%d/%m') AS day,
      COALESCE(SUM(cost_usd), 0) AS cost_usd
    FROM ai_usage_logs
    WHERE created_at >= ${monthStartSql()}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
    `,
  );
  return rows;
}

export async function getAiCostByFeature(): Promise<Array<{ feature: string; cost_usd: number }>> {
  const [rows] = await query<{ feature: string; cost_usd: number }>(
    `
    SELECT
      feature,
      COALESCE(SUM(cost_usd), 0) AS cost_usd
    FROM ai_usage_logs
    WHERE created_at >= ${monthStartSql()}
    GROUP BY feature
    ORDER BY cost_usd DESC
    `,
  );
  return rows;
}

export async function getTopCompaniesByAiCost(limit = 5): Promise<Array<{ company_name: string; cost_usd: number }>> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const [rows] = await query<{ company_name: string; cost_usd: number }>(
    `
    SELECT
      COALESCE(c.name, 'Sem empresa') AS company_name,
      COALESCE(SUM(l.cost_usd), 0) AS cost_usd
    FROM ai_usage_logs l
    LEFT JOIN companies c ON c.id = l.company_id
    WHERE l.created_at >= ${monthStartSql()}
    GROUP BY l.company_id, c.name
    ORDER BY cost_usd DESC
    LIMIT ${safeLimit}
    `,
  );
  return rows;
}

export async function getTokenBreakdown(): Promise<{ input_tokens: number; output_tokens: number; total_tokens: number }> {
  const [[row]] = await query<{ input_tokens: number; output_tokens: number; total_tokens: number }>(
    `
    SELECT
      COALESCE(SUM(prompt_tokens), 0) AS input_tokens,
      COALESCE(SUM(completion_tokens), 0) AS output_tokens,
      COALESCE(SUM(total_tokens), 0) AS total_tokens
    FROM ai_usage_logs
    WHERE created_at >= ${monthStartSql()}
    `,
  );

  return {
    input_tokens: Number(row?.input_tokens || 0),
    output_tokens: Number(row?.output_tokens || 0),
    total_tokens: Number(row?.total_tokens || 0),
  };
}

export async function listCompaniesUsageSummary(): Promise<
  Array<{
    company_id: string;
    company_name: string;
    company_slug: string;
    plan: string;
    subscription_status: string;
    interviews_count: number;
    total_calls_30d: number;
    total_tokens_30d: number;
    total_cost_30d_usd: number;
    estimated_margin_pct: number;
  }>
> {
  const [rows] = await query<{
    company_id: string;
    company_name: string;
    company_slug: string;
    plan: string;
    subscription_status: string;
    interviews_count: number;
    total_calls_30d: number;
    total_tokens_30d: number;
    total_cost_30d_usd: number;
    estimated_margin_pct: number;
  }>(
    `
    SELECT
      c.id AS company_id,
      c.name AS company_name,
      c.slug AS company_slug,
      c.plan,
      c.subscription_status,
      COALESCE(i.interviews_count, 0) AS interviews_count,
      COALESCE(u.total_calls_30d, 0) AS total_calls_30d,
      COALESCE(u.total_tokens_30d, 0) AS total_tokens_30d,
      COALESCE(u.total_cost_30d_usd, 0) AS total_cost_30d_usd,
      CASE
        WHEN COALESCE(u.total_cost_30d_usd, 0) = 0 THEN 0
        WHEN c.plan = 'basic' THEN 55
        WHEN c.plan = 'pro' THEN 68
        WHEN c.plan = 'enterprise' THEN 76
        ELSE 50
      END AS estimated_margin_pct
    FROM companies c
    LEFT JOIN (
      SELECT company_id, COUNT(*) AS interviews_count
      FROM interviews
      GROUP BY company_id
    ) i ON i.company_id = c.id
    LEFT JOIN (
      SELECT
        company_id,
        COUNT(*) AS total_calls_30d,
        COALESCE(SUM(total_tokens), 0) AS total_tokens_30d,
        COALESCE(SUM(cost_usd), 0) AS total_cost_30d_usd
      FROM ai_usage_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY company_id
    ) u ON u.company_id = c.id
    ORDER BY total_cost_30d_usd DESC, c.name ASC
    `,
  );

  return rows;
}

export async function listAiUsageLogs(filters?: {
  companyId?: string;
  model?: string;
  feature?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  rows: Array<{
    id: string;
    created_at: string;
    company_id: string | null;
    company_name: string | null;
    feature: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    latency_ms: number | null;
  }>;
  total: number;
}> {
  const where: string[] = ["1=1"];
  const values: Array<string | number> = [];

  if (filters?.companyId) {
    where.push("l.company_id = ?");
    values.push(filters.companyId);
  }
  if (filters?.model) {
    where.push("l.model = ?");
    values.push(filters.model);
  }
  if (filters?.feature) {
    where.push("l.feature = ?");
    values.push(filters.feature);
  }
  if (filters?.from) {
    where.push("l.created_at >= ?");
    values.push(filters.from);
  }
  if (filters?.to) {
    where.push("l.created_at <= ?");
    values.push(filters.to);
  }
  if (filters?.q) {
    where.push("(c.name LIKE ? OR l.feature LIKE ? OR l.model LIKE ?)");
    const q = `%${filters.q}%`;
    values.push(q, q, q);
  }

  const pageSize = Math.min(Math.max(Number(filters?.pageSize || 20), 5), 100);
  const page = Math.max(Number(filters?.page || 1), 1);
  const offset = (page - 1) * pageSize;

  const whereSql = where.join(" AND ");

  const [[countRow]] = await query<{ total: number }>(
    `
    SELECT COUNT(*) AS total
    FROM ai_usage_logs l
    LEFT JOIN companies c ON c.id = l.company_id
    WHERE ${whereSql}
    `,
    values,
  );

  const [rows] = await query<{
    id: string;
    created_at: string;
    company_id: string | null;
    company_name: string | null;
    feature: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    latency_ms: number | null;
  }>(
    `
    SELECT
      l.id,
      DATE_FORMAT(l.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      l.company_id,
      c.name AS company_name,
      l.feature,
      l.model,
      l.prompt_tokens,
      l.completion_tokens,
      l.total_tokens,
      l.cost_usd,
      l.latency_ms
    FROM ai_usage_logs l
    LEFT JOIN companies c ON c.id = l.company_id
    WHERE ${whereSql}
    ORDER BY l.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
    `,
    values,
  );

  return {
    rows,
    total: Number(countRow?.total || 0),
  };
}

export async function listAiUsageFilterOptions(): Promise<{
  companies: Array<{ id: string; name: string }>;
  features: string[];
  models: string[];
}> {
  const [companies] = await query<{ id: string; name: string }>(
    `SELECT id, name FROM companies ORDER BY name ASC`,
  );

  const [features] = await query<{ feature: string }>(
    `SELECT DISTINCT feature FROM ai_usage_logs ORDER BY feature ASC`,
  );

  const [models] = await query<{ model: string }>(
    `SELECT DISTINCT model FROM ai_usage_logs ORDER BY model ASC`,
  );

  return {
    companies,
    features: features.map((item) => item.feature),
    models: models.map((item) => item.model),
  };
}
