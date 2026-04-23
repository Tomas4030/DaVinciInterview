import { OpenAI } from "openai";
import { jsonParse, query } from "@/lib/db";
import { summarizeInterviewResponses, type ResponseSummary } from "@/lib/response-summary";

type RawResponseRow = {
  sessao_id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  respostas: string | null;
  interview_id: string;
  interview_title: string | null;
  vaga_id: string | null;
  vaga_title: string | null;
};

type CachedComparisonRow = {
  vaga_id: string;
  interview_id: string;
  vaga_title: string | null;
  interview_title: string | null;
  ranking_json: string;
  direct_comparison_json: string;
  candidates_snapshot_json: string;
  source: "ai" | "heuristic";
  generated_at: string;
};

export type CandidateAnalysis = {
  sessaoId: string;
  email: string;
  telefone: string;
  status: string;
  createdAt: string;
  answerCount: number;
  summary: ResponseSummary;
  score: number;
};

export type InterviewAnalysis = {
  interviewId: string;
  interviewTitle: string;
  candidates: CandidateAnalysis[];
  ranking: Array<{
    sessaoId: string;
    email: string;
    score: number;
    reason: string;
  }>;
  directComparison: string[];
  source: "ai" | "heuristic";
  generatedAt: string;
};

export type VagaAnalysis = {
  vagaId: string;
  vagaTitle: string;
  interviews: InterviewAnalysis[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sentimentToScore(sentiment: ResponseSummary["sentiment"]): number {
  if (sentiment === "positivo") return 72;
  if (sentiment === "negativo") return 38;
  return 56;
}

function computeCandidateScore(candidate: CandidateAnalysis): number {
  const base = sentimentToScore(candidate.summary.sentiment);
  const depthBonus = clamp(candidate.answerCount * 2.5, 0, 18);
  const strengthBonus = candidate.summary.strengths.length * 3;
  const concernPenalty = candidate.summary.concerns.length * 2;
  return clamp(Math.round(base + depthBonus + strengthBonus - concernPenalty), 0, 100);
}

function parseAiComparison(content: string) {
  const trimmed = String(content || "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as {
      ranking?: Array<{ sessaoId?: string; score?: number; reason?: string }>;
      directComparison?: string[];
    };
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as {
        ranking?: Array<{ sessaoId?: string; score?: number; reason?: string }>;
        directComparison?: string[];
      };
    } catch {
      return null;
    }
  }
}

async function compareCandidatesForInterview(
  interviewTitle: string,
  candidates: CandidateAnalysis[],
): Promise<Pick<InterviewAnalysis, "ranking" | "directComparison" | "source">> {
  const heuristicRanking = [...candidates]
    .map((candidate) => ({
      sessaoId: candidate.sessaoId,
      email: candidate.email,
      score: computeCandidateScore(candidate),
      reason:
        candidate.summary.executiveSummary ||
        "Perfil avaliado com base na consistencia das respostas.",
    }))
    .sort((a, b) => b.score - a.score);

  const heuristicComparison =
    heuristicRanking.length <= 1
      ? ["Existe apenas um candidato nesta entrevista."]
      : [
          `Melhor score atual: ${heuristicRanking[0].email} (${heuristicRanking[0].score}).`,
          `Maior distancia observada: ${Math.abs(heuristicRanking[0].score - heuristicRanking[heuristicRanking.length - 1].score)} pontos entre topo e ultimo classificado.`,
        ];

  if (!process.env.OPENAI_API_KEY || candidates.length <= 1) {
    return {
      ranking: heuristicRanking,
      directComparison: heuristicComparison,
      source: "heuristic",
    };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const compactCandidates = candidates.map((candidate) => ({
      sessaoId: candidate.sessaoId,
      email: candidate.email,
      answerCount: candidate.answerCount,
      sentiment: candidate.summary.sentiment,
      strengths: candidate.summary.strengths,
      concerns: candidate.summary.concerns,
      executiveSummary: candidate.summary.executiveSummary,
    }));

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "Tu es um analista de recrutamento. Responde apenas JSON valido com ranking e comparacao direta entre candidatos.",
        },
        {
          role: "user",
          content: `Compara candidatos para a entrevista "${interviewTitle}".

Dados: ${JSON.stringify(compactCandidates)}

Retorna JSON com:
{
  "ranking": [
    {"sessaoId":"...", "score": 0-100, "reason": "1 frase"}
  ],
  "directComparison": ["insight 1", "insight 2", "insight 3"]
}

Regras:
- score deve ser consistente com os dados enviados
- comparar pontos fortes e fracos entre candidatos
- sem markdown, sem texto fora do JSON`,
        },
      ],
    });

    const parsed = parseAiComparison(completion.choices[0]?.message?.content || "");
    if (!parsed?.ranking || !Array.isArray(parsed.ranking)) {
      return {
        ranking: heuristicRanking,
        directComparison: heuristicComparison,
        source: "heuristic",
      };
    }

    const ranking = parsed.ranking
      .map((item) => {
        const sessaoId = String(item?.sessaoId || "").trim();
        const candidate = candidates.find((c) => c.sessaoId === sessaoId);
        if (!candidate) return null;
        return {
          sessaoId,
          email: candidate.email,
          score: clamp(Number(item?.score || 0), 0, 100),
          reason:
            String(item?.reason || "").trim() ||
            "Comparacao gerada com base no desempenho geral.",
        };
      })
      .filter(Boolean) as Array<{
      sessaoId: string;
      email: string;
      score: number;
      reason: string;
    }>;

    const rankingFinal =
      ranking.length > 0 ? ranking.sort((a, b) => b.score - a.score) : heuristicRanking;

    const directComparison = Array.isArray(parsed.directComparison)
      ? parsed.directComparison
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .slice(0, 4)
      : heuristicComparison;

    return {
      ranking: rankingFinal,
      directComparison:
        directComparison.length > 0 ? directComparison : heuristicComparison,
      source: "ai",
    };
  } catch (error) {
    console.warn("[ai-comparacao] fallback heuristico:", error);
    return {
      ranking: heuristicRanking,
      directComparison: heuristicComparison,
      source: "heuristic",
    };
  }
}

async function upsertComparisonCache(
  companyId: string,
  vagaId: string,
  interview: InterviewAnalysis,
  vagaTitle: string,
) {
  await query(
    `
    INSERT INTO ai_candidate_comparisons (
      id,
      company_id,
      vaga_id,
      interview_id,
      vaga_title,
      interview_title,
      total_candidates,
      ranking_json,
      direct_comparison_json,
      candidates_snapshot_json,
      source,
      generated_at
    ) VALUES (
      UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
    )
    ON DUPLICATE KEY UPDATE
      vaga_title = VALUES(vaga_title),
      interview_title = VALUES(interview_title),
      total_candidates = VALUES(total_candidates),
      ranking_json = VALUES(ranking_json),
      direct_comparison_json = VALUES(direct_comparison_json),
      candidates_snapshot_json = VALUES(candidates_snapshot_json),
      source = VALUES(source),
      generated_at = NOW()
    `,
    [
      companyId,
      vagaId,
      interview.interviewId,
      vagaTitle,
      interview.interviewTitle,
      interview.candidates.length,
      JSON.stringify(interview.ranking),
      JSON.stringify(interview.directComparison),
      JSON.stringify(interview.candidates),
      interview.source,
    ],
  );
}

export async function buildAiComparisonsForCompany(
  companyId: string,
  options?: { forceRegenerate?: boolean },
): Promise<VagaAnalysis[]> {
  const forceRegenerate = Boolean(options?.forceRegenerate);

  const [rows] = await query<RawResponseRow>(
    `
    SELECT
      cr.sessao_id,
      cr.email,
      cr.telefone,
      cr.status,
      cr.criada_em AS created_at,
      cr.respostas,
      cr.interview_id,
      i.title AS interview_title,
      COALESCE(i.legacy_vaga_id, i.id) AS vaga_id,
      COALESCE(v.titulo, i.title) AS vaga_title
    FROM candidato_respostas cr
    LEFT JOIN interviews i ON i.id = cr.interview_id
    LEFT JOIN vagas v ON v.id = i.legacy_vaga_id
    WHERE cr.company_id = ?
    ORDER BY vaga_title ASC, i.title ASC, cr.criada_em DESC
    LIMIT 400
    `,
    [companyId],
  );

  const [cachedRows] = await query<CachedComparisonRow>(
    `
    SELECT
      vaga_id,
      interview_id,
      vaga_title,
      interview_title,
      ranking_json,
      direct_comparison_json,
      candidates_snapshot_json,
      source,
      generated_at
    FROM ai_candidate_comparisons
    WHERE company_id = ?
    `,
    [companyId],
  );

  const cachedByKey = new Map<string, CachedComparisonRow>();
  for (const row of cachedRows) {
    cachedByKey.set(`${row.vaga_id}::${row.interview_id}`, row);
  }

  const grouped = new Map<
    string,
    { vagaTitle: string; interviews: Map<string, { interviewTitle: string; rows: RawResponseRow[] }> }
  >();

  for (const row of rows) {
    const vagaId = String(row.vaga_id || "sem-vaga");
    const vagaTitle = String(row.vaga_title || "Vaga sem titulo");
    const interviewId = String(row.interview_id || "sem-entrevista");
    const interviewTitle = String(row.interview_title || "Entrevista sem titulo");

    if (!grouped.has(vagaId)) {
      grouped.set(vagaId, { vagaTitle, interviews: new Map() });
    }

    const vaga = grouped.get(vagaId)!;
    if (!vaga.interviews.has(interviewId)) {
      vaga.interviews.set(interviewId, { interviewTitle, rows: [] });
    }

    vaga.interviews.get(interviewId)!.rows.push(row);
  }

  const vagas: VagaAnalysis[] = [];

  for (const [vagaId, vagaEntry] of grouped.entries()) {
    const interviews: InterviewAnalysis[] = [];

    for (const [interviewId, interviewEntry] of vagaEntry.interviews.entries()) {
      const cacheKey = `${vagaId}::${interviewId}`;
      const cached = cachedByKey.get(cacheKey);

      if (cached && !forceRegenerate) {
        interviews.push({
          interviewId,
          interviewTitle: String(cached.interview_title || interviewEntry.interviewTitle),
          candidates: jsonParse<CandidateAnalysis[]>(cached.candidates_snapshot_json) || [],
          ranking: jsonParse<InterviewAnalysis["ranking"]>(cached.ranking_json) || [],
          directComparison:
            jsonParse<string[]>(cached.direct_comparison_json) ||
            ["Sem comparacao disponivel."],
          source: cached.source || "heuristic",
          generatedAt: cached.generated_at,
        });
        continue;
      }

      const candidates: CandidateAnalysis[] = [];
      for (const row of interviewEntry.rows) {
        const answers = jsonParse<any[]>(row.respostas) || [];
        const items = answers.map((item, index) => ({
          question: String(
            item?.texto_pergunta ||
              item?.question ||
              item?.pergunta ||
              `Pergunta ${index + 1}`,
          ),
          answer: String(item?.resposta_texto || item?.resposta || item?.answer || "").trim(),
        }));

        const summary = await summarizeInterviewResponses(items, interviewEntry.interviewTitle);
        const candidate: CandidateAnalysis = {
          sessaoId: row.sessao_id,
          email: row.email,
          telefone: row.telefone,
          status: row.status,
          createdAt: row.created_at,
          answerCount: items.filter((item) => item.answer.length > 0).length,
          summary,
          score: 0,
        };

        candidate.score = computeCandidateScore(candidate);
        candidates.push(candidate);
      }

      const comparison = await compareCandidatesForInterview(interviewEntry.interviewTitle, candidates);
      const generatedAt = new Date().toISOString();

      const interview: InterviewAnalysis = {
        interviewId,
        interviewTitle: interviewEntry.interviewTitle,
        candidates,
        ranking: comparison.ranking,
        directComparison: comparison.directComparison,
        source: comparison.source,
        generatedAt,
      };

      await upsertComparisonCache(companyId, vagaId, interview, vagaEntry.vagaTitle);
      interviews.push(interview);
    }

    vagas.push({
      vagaId,
      vagaTitle: vagaEntry.vagaTitle,
      interviews,
    });
  }

  return vagas;
}
