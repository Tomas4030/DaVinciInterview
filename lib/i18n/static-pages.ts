import { i18nT, i18nTObject } from "@/lib/i18n/core";

export function tStaticPages(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18nT(locale, "staticPages", key, options);
}

export function tStaticPagesObject<T>(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): T {
  return i18nTObject<T>(locale, "staticPages", key, options);
}
