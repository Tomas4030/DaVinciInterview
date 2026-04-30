const DEFAULT_USD_TO_EUR_RATE = 0.92;

export const USD_TO_EUR_RATE = Number(process.env.USD_TO_EUR_RATE || DEFAULT_USD_TO_EUR_RATE);

export function usdToEur(valueUsd: number): number {
  const numeric = Number(valueUsd || 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric * USD_TO_EUR_RATE;
}

export function formatEur(valueEur: number, minimumFractionDigits = 2, maximumFractionDigits = 2): string {
  const numeric = Number(valueEur || 0);
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numeric);
}
