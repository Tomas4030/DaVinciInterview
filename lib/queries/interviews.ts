import { jsonParse, query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface InterviewRecord {
  id: string;
  company_id: string;
  legacy_vaga_id: string | null;
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

export async function getInterviewById(
  interviewId: string,
): Promise<InterviewRecord | null> {
  const [rows] = await query(
    `SELECT * FROM interviews WHERE id = ? LIMIT 1`,
    [interviewId],
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
  const [rows] = await query(
    `
    SELECT *
    FROM interviews
    WHERE company_id = ?
    ORDER BY created_at DESC
    `,
    [companyId],
  );

  return (rows as any[]).map(mapInterview);
}

export async function listPublishedInterviewsByCompany(
  companyId: string,
): Promise<InterviewRecord[]> {
  const [rows] = await query(
    `
    SELECT *
    FROM interviews
    WHERE company_id = ? AND status = 'published'
    ORDER BY created_at DESC
    `,
    [companyId],
  );

  return (rows as any[]).map(mapInterview);
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
    INSERT INTO interviews (id, company_id, title, description, status, questions)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      interviewId,
      companyId,
      String(input.title || "").trim(),
      input.description ?? null,
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
    SET title = ?, description = ?, status = ?, questions = ?
    WHERE id = ? AND company_id = ?
    `,
    [
      String(input.title || "").trim(),
      input.description ?? null,
      input.status || "draft",
      JSON.stringify(input.questions || []),
      interviewId,
      companyId,
    ],
  );

  return await getInterviewByIdAndCompany(interviewId, companyId);
}
