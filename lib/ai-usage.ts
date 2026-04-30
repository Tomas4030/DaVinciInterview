import "server-only";
import { query } from "@/lib/db";

type UsageLike = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type AiUsageLogInput = {
  companyId?: string | null;
  userId?: string | null;
  interviewId?: string | null;
  sessionId?: string | null;
  feature: string;
  model: string;
  usage?: UsageLike | null;
  latencyMs?: number | null;
  metadata?: Record<string, unknown> | null;
};

const MODEL_PRICING_USD_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

function toInt(value: unknown): number {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

export function calculateAiCostUsd(model: string, usage?: UsageLike | null): number {
  const pricing = MODEL_PRICING_USD_PER_1M_TOKENS[model];
  if (!pricing || !usage) return 0;

  const promptTokens = toInt(usage.prompt_tokens);
  const completionTokens = toInt(usage.completion_tokens);

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return Number((inputCost + outputCost).toFixed(8));
}

export async function logAiUsage(input: AiUsageLogInput): Promise<void> {
  try {
    const promptTokens = toInt(input.usage?.prompt_tokens);
    const completionTokens = toInt(input.usage?.completion_tokens);
    const totalTokensRaw = toInt(input.usage?.total_tokens);
    const totalTokens = totalTokensRaw || promptTokens + completionTokens;
    const costUsd = calculateAiCostUsd(input.model, {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    });

    await query(
      `
      INSERT INTO ai_usage_logs (
        id,
        company_id,
        user_id,
        interview_id,
        session_id,
        feature,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_usd,
        latency_ms,
        metadata_json,
        created_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
      )
      `,
      [
        input.companyId || null,
        input.userId || null,
        input.interviewId || null,
        input.sessionId || null,
        input.feature,
        input.model,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        input.latencyMs ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    );
  } catch (error) {
    console.warn("[ai-usage] failed to persist usage log", error);
  }
}
