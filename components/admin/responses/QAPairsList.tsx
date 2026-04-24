import type { ResponseAnswerItem } from "./types";

type Props = {
  answers: ResponseAnswerItem[];
};

function getQuestionLabel(item: ResponseAnswerItem, index: number): string {
  if (typeof item?.texto_pergunta === "string" && item.texto_pergunta.trim()) {
    return item.texto_pergunta;
  }
  if (typeof item?.question === "string" && item.question.trim()) {
    return item.question;
  }
  if (typeof item?.pergunta === "string" && item.pergunta.trim()) {
    return item.pergunta;
  }

  return `Pergunta ${index + 1}`;
}

function getAnswerText(item: ResponseAnswerItem): string {
  if (typeof item?.resposta_texto === "string" && item.resposta_texto.trim()) {
    return item.resposta_texto;
  }
  if (typeof item?.resposta === "string" && item.resposta.trim()) {
    return item.resposta;
  }
  if (typeof item?.answer === "string" && item.answer.trim()) {
    return item.answer;
  }
  return "—";
}

export default function QAPairsList({ answers }: Props) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
      <h2 className="text-base font-semibold text-[var(--c-text)]">Perguntas e respostas</h2>

      {answers.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--c-muted)]">
          Não existem respostas nesta sessão.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {answers.map((item, index) => (
            <article
              key={index}
              className="rounded-lg border border-[var(--c-border)]/60 bg-[var(--c-bg)] px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--c-muted)]">
                {getQuestionLabel(item, index)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--c-text)]/90">
                {getAnswerText(item)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
