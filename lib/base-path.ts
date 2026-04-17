const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const BASE_PATH = rawBasePath.replace(/\/+$/, "");

export function withBasePath(path: string) {
  if (!path) return BASE_PATH || "/";

  // já vem com o basePath
  if (BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`))) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return BASE_PATH ? `${BASE_PATH}${normalizedPath}` : normalizedPath;
}