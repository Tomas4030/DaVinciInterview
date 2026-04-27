import type { Metadata } from "next";
import StaticInfoPage from "@/components/home/StaticInfoPage";
import { tStaticPages, tStaticPagesObject } from "@/lib/i18n/static-pages";
import type { StaticPageContent } from "@/lib/i18n/types";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tStaticPages(params.locale, "privacy.meta.title"),
    description: tStaticPages(params.locale, "privacy.meta.description"),
    alternates: {
      canonical: `/${params.locale}/privacidade`,
    },
  };
}

export default function PrivacyPage({ params }: Props) {
  const content = tStaticPagesObject<StaticPageContent>(
    params.locale,
    "privacy",
  );

  return (
    <StaticInfoPage
      locale={params.locale}
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      sideNoteLabel={content.sideNoteLabel}
      sideNoteTitle={content.sideNoteTitle}
      sideNoteBody={content.sideNoteBody}
      sections={content.sections}
    />
  );
}
