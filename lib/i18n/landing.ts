import { i18nT, i18nTObject } from "@/lib/i18n/core";

export function tLanding(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18nT(locale, "landing", key, options);
}

export function tLandingObject<T>(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): T {
  return i18nTObject<T>(locale, "landing", key, options);
}
