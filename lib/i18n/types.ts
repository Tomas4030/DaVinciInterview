export type StaticSectionTone =
  | "neutral"
  | "blue"
  | "green"
  | "yellow"
  | "red";

export type StaticPageSection = {
  title: string;
  body: string[];
  tone?: StaticSectionTone;
};

export type StaticPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  sideNoteLabel: string;
  sideNoteTitle: string;
  sideNoteBody: string;
  sections: StaticPageSection[];
};
