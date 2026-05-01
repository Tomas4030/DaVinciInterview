import { toQueryString, type QueryParamsInput, withPage } from "@/lib/url-query";

type Props = {
  basePath: string;
  params: QueryParamsInput;
  page: number;
  totalPages: number;
};

export default function TablePaginationLinks({
  basePath,
  params,
  page,
  totalPages,
}: Props) {
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;
  const prevHref = `${basePath}?${toQueryString(withPage(params, Math.max(page - 1, 1)))}`;
  const nextHref = `${basePath}?${toQueryString(withPage(params, Math.min(page + 1, totalPages)))}`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <a
        href={isPrevDisabled ? undefined : prevHref}
        aria-disabled={isPrevDisabled}
        className={`rounded-lg px-3 py-1 ${
          isPrevDisabled
            ? "cursor-not-allowed bg-slate-100 text-slate-300"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        ‹
      </a>
      <span className="rounded-lg bg-indigo-600 px-3 py-1 text-white">{page}</span>
      <a
        href={isNextDisabled ? undefined : nextHref}
        aria-disabled={isNextDisabled}
        className={`rounded-lg px-3 py-1 ${
          isNextDisabled
            ? "cursor-not-allowed bg-slate-100 text-slate-300"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        ›
      </a>
    </div>
  );
}
