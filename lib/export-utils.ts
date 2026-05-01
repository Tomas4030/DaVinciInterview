export function csvEscape(value: string | number): string {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes("\"") ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/\"/g, '""')}"`;
  }
  return stringValue;
}

export function getIsoDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
