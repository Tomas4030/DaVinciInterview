const DEFAULT_USD_TO_EUR_RATE = 0.92;

export const USD_TO_EUR_RATE = Number(
  process.env.USD_TO_EUR_RATE || DEFAULT_USD_TO_EUR_RATE,
);

export function usdToEur(valueUsd: number): number {
  return Number(valueUsd || 0) * USD_TO_EUR_RATE;
}

export function formatEur(value: number, options?: { maxDecimals?: number }): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: options?.maxDecimals ?? 4,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-PT").format(value || 0);
}
