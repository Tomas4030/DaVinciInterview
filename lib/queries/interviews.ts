import { getConnection, jsonParse, query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface InterviewRecord {
  id: string;
  company_id: string;
  legacy_vaga_id: string | null;
  legacy_modalidade?: string | null;
  work_mode?: "remote" | "hybrid" | "onsite" | "unspecified" | null;
  employment_type?:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship"
    | "unspecified"
    | null;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  questions: any[];
  created_at: string;
  updated_at: string;
}

function mapInterview(row: any): InterviewRecord {
  return {
    id: row.id,
    company_id: row.company_id,
    legacy_vaga_id: row.legacy_vaga_id ?? null,
    legacy_modalidade: row.legacy_modalidade ?? null,
    work_mode: row.work_mode ?? null,
    employment_type: row.employment_type ?? null,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    questions: Array.isArray(row.questions)
      ? row.questions
      : (jsonParse<any[]>(row.questions) ?? []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function isLegacyVagasUnavailable(error: any): boolean {
  const code = String(error?.code || "");
  return code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR";
}

export async function getInterviewById(
  interviewId: string,
  companyId: string,
): Promise<InterviewRecord | null> {
  const [rows] = await query(
    `SELECT * FROM interviews WHERE id = ? AND company_id = ? LIMIT 1`,
    [interviewId, companyId],
  );

  const list = rows as any[];
  if (list.length === 0) return null;
  return mapInterview(list[0]);
}

export async function getInterviewByIdAndCompany(
  interviewId: string,
  companyId: string,
): Promise<InterviewRecord | null> {
  const [rows] = await query(
    `SELECT * FROM interviews WHERE id = ? AND company_id = ? LIMIT 1`,
    [interviewId, companyId],
  );

  const list = rows as any[];
  if (list.length === 0) return null;
  return mapInterview(list[0]);
}

export async function getInterviewByLegacyVagaId(
  vagaId: string,
): Promise<InterviewRecord | null> {
  const [rows] = await query(
    `SELECT * FROM interviews WHERE legacy_vaga_id = ? LIMIT 1`,
    [vagaId],
  );

  const list = rows as any[];
  if (list.length === 0) return null;
  return mapInterview(list[0]);
}

export async function listInterviewsByCompany(
  companyId: string,
): Promise<InterviewRecord[]> {
  let rows: any[] = [];

  try {
    const [joinedRows] = await query(
      `
      SELECT i.*, v.modalidade AS legacy_modalidade
      FROM interviews i
      LEFT JOIN vagas v ON v.id = i.legacy_vaga_id
      WHERE i.company_id = ?
      ORDER BY i.created_at DESC
      `,
      [companyId],
    );
    rows = joinedRows as any[];
  } catch (error: any) {
    if (!isLegacyVagasUnavailable(error)) {
      throw error;
    }

    const [fallbackRows] = await query(
      `
      SELECT i.*, NULL AS legacy_modalidade
      FROM interviews i
      WHERE i.company_id = ?
      ORDER BY i.created_at DESC
      `,
      [companyId],
    );
    rows = fallbackRows as any[];
  }

  return rows.map(mapInterview);
}

export async function listPublishedInterviewsByCompany(
  companyId: string,
): Promise<InterviewRecord[]> {
  let rows: any[] = [];

  try {
    const [joinedRows] = await query(
      `
      SELECT i.*, v.modalidade AS legacy_modalidade
      FROM interviews i
      LEFT JOIN vagas v ON v.id = i.legacy_vaga_id
      WHERE i.company_id = ? AND i.status = 'published'
      ORDER BY i.created_at DESC
      `,
      [companyId],
    );
    rows = joinedRows as any[];
  } catch (error: any) {
    if (!isLegacyVagasUnavailable(error)) {
      throw error;
    }

    const [fallbackRows] = await query(
      `
      SELECT i.*, NULL AS legacy_modalidade
      FROM interviews i
      WHERE i.company_id = ? AND i.status = 'published'
      ORDER BY i.created_at DESC
      `,
      [companyId],
    );
    rows = fallbackRows as any[];
  }

  return rows.map(mapInterview);
}

export async function countPublishedInterviewsByCompany(
  companyId: string,
): Promise<number> {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!normalizedCompanyId) return 0;

  const [rows] = await query<{ total: number }>(
    `
    SELECT COUNT(*) AS total
    FROM interviews
    WHERE company_id = ? AND status = 'published'
    `,
    [normalizedCompanyId],
  );

  return Number(rows?.[0]?.total || 0);
}

export async function resolveCompanyAndInterviewFromLegacyVaga(
  vagaId: string,
): Promise<{ companyId: string; interviewId: string } | null> {
  const interview = await getInterviewByLegacyVagaId(vagaId);
  if (!interview) return null;

  return {
    companyId: interview.company_id,
    interviewId: interview.id,
  };
}

type SaveInterviewInput = {
  title: string;
  description?: string | null;
  workMode?: "remote" | "hybrid" | "onsite" | "unspecified";
  employmentType?:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship"
    | "unspecified";
  status?: "draft" | "published" | "archived";
  questions?: any[];
};

export async function createInterviewForCompany(
  companyId: string,
  input: SaveInterviewInput,
): Promise<InterviewRecord> {
  const interviewId = uuidv4();

  await query(
    `
    INSERT INTO interviews (id, company_id, title, description, work_mode, employment_type, status, questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      interviewId,
      companyId,
      String(input.title || "").trim(),
      input.description ?? null,
      input.workMode || "unspecified",
      input.employmentType || "unspecified",
      input.status || "draft",
      JSON.stringify(input.questions || []),
    ],
  );

  const created = await getInterviewByIdAndCompany(interviewId, companyId);
  if (!created) {
    throw new Error("Entrevista criada mas não encontrada");
  }

  return created;
}

export async function updateInterviewForCompany(
  interviewId: string,
  companyId: string,
  input: SaveInterviewInput,
): Promise<InterviewRecord | null> {
  const existing = await getInterviewByIdAndCompany(interviewId, companyId);
  if (!existing) return null;

  await query(
    `
    UPDATE interviews
    SET title = ?, description = ?, work_mode = ?, employment_type = ?, status = ?, questions = ?
    WHERE id = ? AND company_id = ?
    `,
    [
      String(input.title || "").trim(),
      input.description ?? null,
      input.workMode || "unspecified",
      input.employmentType || "unspecified",
      input.status || "draft",
      JSON.stringify(input.questions || []),
      interviewId,
      companyId,
    ],
  );

  return await getInterviewByIdAndCompany(interviewId, companyId);
}

export async function deleteInterviewForCompany(
  interviewId: string,
  companyId: string,
): Promise<boolean> {
  const existing = await getInterviewByIdAndCompany(interviewId, companyId);
  if (!existing) return false;

  const sessionVagaIds = [interviewId];
  if (existing.legacy_vaga_id && existing.legacy_vaga_id !== interviewId) {
    sessionVagaIds.push(existing.legacy_vaga_id);
  }

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM candidato_respostas WHERE company_id = ? AND interview_id = ?`,
      [companyId, interviewId],
    );

    try {
      await connection.execute(
        `DELETE FROM ai_candidate_comparisons WHERE company_id = ? AND interview_id = ?`,
        [companyId, interviewId],
      );
    } catch (error: any) {
      if (error?.code !== "ER_NO_SUCH_TABLE") throw error;
    }

    if (sessionVagaIds.length === 1) {
      await connection.execute(
        `DELETE FROM candidato_entrevista_sessions WHERE vaga_id = ?`,
        [sessionVagaIds[0]],
      );
    } else {
      await connection.execute(
        `DELETE FROM candidato_entrevista_sessions WHERE vaga_id IN (?, ?)`,
        [sessionVagaIds[0], sessionVagaIds[1]],
      );
    }

    const [result] = await connection.execute(
      `DELETE FROM interviews WHERE id = ? AND company_id = ?`,
      [interviewId, companyId],
    );

    await connection.commit();

    return ((result as any)?.affectedRows || 0) > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
