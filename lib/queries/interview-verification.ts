import { query } from "@/lib/db";

export function gerarCodigoVerificacaoEntrevista(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type CreateInterviewVerificationCodeInput = {
  email: string;
  telefone: string;
  telefonePais: string;
  companyId: string;
  interviewId: string;
  candidateName: string;
};

export async function criarCodigoVerificacaoEntrevista(
  input: CreateInterviewVerificationCodeInput,
): Promise<string> {
  const codigo = gerarCodigoVerificacaoEntrevista();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await query(
    `
    DELETE FROM interview_verification_codes
    WHERE email = ? AND company_id = ? AND interview_id = ?
    `,
    [input.email, input.companyId, input.interviewId],
  );

  await query(
    `
    INSERT INTO interview_verification_codes (
      email,
      telefone,
      telefone_pais,
      candidate_name,
      company_id,
      interview_id,
      code,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.email,
      input.telefone,
      input.telefonePais,
      input.candidateName,
      input.companyId,
      input.interviewId,
      codigo,
      expiresAt,
    ],
  );

  return codigo;
}

type VerificationCodeRecord = {
  id: number;
  email: string;
  telefone: string;
  telefone_pais: string;
  candidate_name: string;
};

export async function consumirCodigoVerificacaoEntrevista(
  email: string,
  code: string,
  companyId: string,
  interviewId: string,
): Promise<VerificationCodeRecord | null> {
  const [rows] = await query<VerificationCodeRecord>(
    `
    SELECT id, email, telefone, telefone_pais, candidate_name
    FROM interview_verification_codes
    WHERE email = ?
      AND code = ?
      AND company_id = ?
      AND interview_id = ?
      AND expires_at > NOW()
    LIMIT 1
    `,
    [email, code, companyId, interviewId],
  );

  const matched = rows[0] || null;
  if (!matched) return null;

  await query(`DELETE FROM interview_verification_codes WHERE id = ?`, [matched.id]);

  return matched;
}
