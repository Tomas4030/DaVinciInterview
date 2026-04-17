function normalizeBasePath(rawBasePath = "") {
  const trimmed = String(rawBasePath).trim().replace(/\/+$/, "");

  if (!trimmed) return "";

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const segments = normalized.split("/").filter(Boolean);

  if (
    segments.length > 1 &&
    segments.every((segment) => segment === segments[0])
  ) {
    return `/${segments[0]}`;
  }

  return normalized;
}

module.exports = {
  normalizeBasePath,
};