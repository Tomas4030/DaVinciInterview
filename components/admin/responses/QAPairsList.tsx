import type { ResponseAnswerItem } from "./types";
import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  answers: ResponseAnswerItem[];
  locale?: string;
};

function getQuestionLabel(
  item: ResponseAnswerItem,
  index: number,
  locale: string,
): string {
  if (typeof item?.texto_pergunta === "string" && item.texto_pergunta.trim()) {
    return item.texto_pergunta;
  }
  if (typeof item?.question === "string" && item.question.trim()) {
    return item.question;
  }
  if (typeof item?.pergunta === "string" && item.pergunta.trim()) {
    return item.pergunta;
  }

  return tAdmin(locale, "responses.qaPairs.questionFallback", {
    number: index + 1,
  });
}

function getAnswerText(item: ResponseAnswerItem, locale: string): string {
  if (typeof item?.resposta_texto === "string" && item.resposta_texto.trim()) {
    return item.resposta_texto;
  }
  if (typeof item?.resposta === "string" && item.resposta.trim()) {
    return item.resposta;
  }
  if (typeof item?.answer === "string" && item.answer.trim()) {
    return item.answer;
  }
  return tAdmin(locale, "responses.qaPairs.answerFallback");
}

export default function QAPairsList({ answers, locale = "pt" }: Props) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
      <h2 className="text-base font-semibold text-[var(--c-text)]">
        {tAdmin(locale, "responses.qaPairs.title")}
      </h2>

      {answers.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--c-muted)]">
          {tAdmin(locale, "responses.qaPairs.empty")}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {answers.map((item, index) => (
            <article
              key={index}
              className="rounded-lg border border-[var(--c-border)]/60 bg-[var(--c-bg)] px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--c-muted)]">
                {getQuestionLabel(item, index, locale)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--c-text)]/90">
                {getAnswerText(item, locale)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
