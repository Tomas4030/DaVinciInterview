export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getIsoDateDaysAgo(days: number): string {
  const safeDays = Number.isFinite(days) ? Math.max(Math.floor(days), 0) : 0;
  const date = new Date();
  date.setDate(date.getDate() - safeDays);
  return date.toISOString().slice(0, 10);
}

export function getDefaultLast30DaysRange(): { from: string; to: string } {
  return {
    from: getIsoDateDaysAgo(30),
    to: getTodayIsoDate(),
  };
}
