type QueryPrimitive = string | number | boolean | null | undefined;

export type QueryParamsInput = Record<string, QueryPrimitive>;

export function toQueryString(params: QueryParamsInput): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (!normalized) continue;
    searchParams.set(key, normalized);
  }

  return searchParams.toString();
}

export function withPage(params: QueryParamsInput, page: number): QueryParamsInput {
  return {
    ...params,
    page: String(Math.max(1, Math.floor(page))),
  };
}

export function updateQueryString(
  currentQueryString: string,
  updates: QueryParamsInput,
  options?: { resetPage?: boolean },
): string {
  const searchParams = new URLSearchParams(currentQueryString);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      searchParams.delete(key);
      continue;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      searchParams.delete(key);
      continue;
    }

    searchParams.set(key, normalized);
  }

  if (options?.resetPage) {
    searchParams.set("page", "1");
  }

  return searchParams.toString();
}
