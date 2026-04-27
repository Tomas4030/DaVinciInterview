import { i18nT, i18nTObject } from "@/lib/i18n/core";

export function tAuth(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18nT(locale, "auth", key, options);
}

export function tAuthObject<T>(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): T {
  return i18nTObject<T>(locale, "auth", key, options);
}
