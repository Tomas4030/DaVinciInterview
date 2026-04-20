export function slugify(value: string): string {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const slug = normalized
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return slug || "empresa";
}

export function buildSlugCandidates(baseName: string, max = 20): string[] {
  const base = slugify(baseName);
  const candidates = [base];

  for (let i = 2; i <= max; i += 1) {
    candidates.push(`${base}-${i}`);
  }

  return candidates;
}
