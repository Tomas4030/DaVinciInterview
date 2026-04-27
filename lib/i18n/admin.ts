import { i18nT, i18nTObject } from "@/lib/i18n/core";

export function tAdmin(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18nT(locale, "admin", key, options);
}

export function tAdminObject<T>(
  locale: string,
  key: string,
  options?: Record<string, unknown>,
): T {
  return i18nTObject<T>(locale, "admin", key, options);
}
