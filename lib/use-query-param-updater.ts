"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateQueryString, type QueryParamsInput } from "@/lib/url-query";

export function useQueryParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: QueryParamsInput, options?: { resetPage?: boolean }) {
    const nextQuery = updateQueryString(searchParams.toString(), updates, options);
    startTransition(() => {
      router.replace(`${pathname}?${nextQuery}`);
    });
  }

  function replacePath() {
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return {
    isPending,
    searchParams,
    updateParams,
    replacePath,
  };
}
