import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const localizedStaticPaths = ["", "/pricing", "/termos", "/privacidade", "/sobre", "/contacto", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return SUPPORTED_LOCALES.flatMap((locale) =>
    localizedStaticPaths.map((path) => {
      const url = path ? `${appUrl}/${locale}${path}` : `${appUrl}/${locale}`;
      const isHome = path === "";
      const isPricing = path === "/pricing";
      const isLegal = path === "/termos" || path === "/privacidade";

      return {
        url,
        lastModified: now,
        changeFrequency: isHome ? "daily" : isPricing ? "weekly" : "monthly",
        priority: isHome ? 1 : isPricing ? 0.9 : isLegal ? 0.4 : 0.7,
      };
    }),
  );
}
