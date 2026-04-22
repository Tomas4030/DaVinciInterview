import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { jsonParse, query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

type ResponseRow = {
  interview_title: string | null;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  respostas: string | null;
};

function getQuestionLabel(item: any, index: number): string {
  if (typeof item?.texto_pergunta === "string" && item.texto_pergunta.trim()) {
    return item.texto_pergunta;
  }
  if (typeof item?.question === "string" && item.question.trim()) {
    return item.question;
  }
  if (typeof item?.pergunta === "string" && item.pergunta.trim()) {
    return item.pergunta;
  }
  return `Pergunta ${index + 1}`;
}

function getAnswerText(item: any): string {
  if (typeof item?.resposta_texto === "string" && item.resposta_texto.trim()) {
    return item.resposta_texto;
  }
  if (typeof item?.resposta === "string" && item.resposta.trim()) {
    return item.resposta;
  }
  if (typeof item?.answer === "string" && item.answer.trim()) {
    return item.answer;
  }
  return "";
}

function escapeCsv(value: string): string {
  const normalized = String(value || "").replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; sessionId: string } },
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
  }

  const [rows] = await query<ResponseRow>(
    `
    SELECT
      i.title AS interview_title,
      cr.email,
      cr.telefone,
      cr.status,
      cr.criada_em AS created_at,
      cr.respostas
    FROM candidato_respostas cr
    LEFT JOIN interviews i ON i.id = cr.interview_id
    WHERE cr.company_id = ? AND cr.sessao_id = ?
    LIMIT 1
    `,
    [membership.company.id, params.sessionId],
  );

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
  }

  const answers = jsonParse<any[]>(row.respostas) || [];
  const header = [
    "session_id",
    "interview_title",
    "candidate_email",
    "candidate_phone",
    "status",
    "created_at",
    "question_index",
    "question",
    "answer",
  ];

  const lines = [header.map(escapeCsv).join(",")];

  if (answers.length === 0) {
    lines.push(
      [
        params.sessionId,
        row.interview_title || "",
        row.email,
        row.telefone || "",
        row.status,
        row.created_at,
        "",
        "",
        "",
      ]
        .map(escapeCsv)
        .join(","),
    );
  } else {
    for (let i = 0; i < answers.length; i += 1) {
      lines.push(
        [
          params.sessionId,
          row.interview_title || "",
          row.email,
          row.telefone || "",
          row.status,
          row.created_at,
          String(i + 1),
          getQuestionLabel(answers[i], i),
          getAnswerText(answers[i]),
        ]
          .map(escapeCsv)
          .join(","),
      );
    }
  }

  const csv = `\uFEFF${lines.join("\n")}`;
  const filename = `transcricao-${params.sessionId}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
