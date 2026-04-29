import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/lib/i18n/locales";

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isSupportedLocale(params.locale)) {
    notFound();
  }

  return children;
}
