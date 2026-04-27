"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
};

type HeroChatPreviewProps = {
  previewLabel: string;
  messages: ChatMessage[];
  loop?: boolean;
};

const INITIAL_DELAY_MS = 450;
const LOOP_PAUSE_MS = 5000;
const USER_DELAY_BASE_MS = 420;
const USER_PER_CHAR_DELAY_MS = 14;
const BOT_THINKING_BASE_MS = 1200;
const BOT_PER_CHAR_THINKING_MS = 24;
const BOT_TYPING_PER_CHAR_MS = 42;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function userDelay(message: ChatMessage): number {
  return Math.min(
    USER_DELAY_BASE_MS + message.text.length * USER_PER_CHAR_DELAY_MS,
    1400,
  );
}

function botThinkingDelay(message: ChatMessage): number {
  const longMessageExtra = message.text.length > 85 ? 700 : 0;
  return Math.min(
    BOT_THINKING_BASE_MS +
      message.text.length * BOT_PER_CHAR_THINKING_MS +
      longMessageExtra,
    4200,
  );
}

export default function HeroChatPreview({
  previewLabel,
  messages,
  loop = true,
}: HeroChatPreviewProps) {
  const safeMessages = useMemo(
    () => messages.filter((item) => item.text.trim().length > 0),
    [messages],
  );

  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);
  const [typedChars, setTypedChars] = useState(0);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      28;
    setIsPinnedToBottom(nearBottom);
  }

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPinnedToBottom) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "auto",
    });
  }, [displayedMessages, typedChars, typingMessage, isPinnedToBottom]);

  useEffect(() => {
    if (safeMessages.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      while (!cancelled) {
        setDisplayedMessages([]);
        setTypingMessage(null);
        setTypedChars(0);
        setIsBotThinking(false);

        await wait(INITIAL_DELAY_MS);
        if (cancelled) {
          return;
        }

        for (const message of safeMessages) {
          if (cancelled) {
            return;
          }

          if (message.from === "user") {
            await wait(userDelay(message));
            if (cancelled) {
              return;
            }
            setDisplayedMessages((prev) => [...prev, message]);
            continue;
          }

          setIsBotThinking(true);
          setTypingMessage(null);
          setTypedChars(0);
          await wait(botThinkingDelay(message));

          if (cancelled) {
            return;
          }

          setIsBotThinking(false);
          setTypingMessage(message);
          setTypedChars(0);

          for (let i = 1; i <= message.text.length; i += 1) {
            if (cancelled) {
              return;
            }
            setTypedChars(i);
            await wait(BOT_TYPING_PER_CHAR_MS);
          }

          if (cancelled) {
            return;
          }

          setDisplayedMessages((prev) => [...prev, message]);
          setTypingMessage(null);
          setTypedChars(0);
          setIsBotThinking(false);
          await wait(220);
        }

        if (!loop) {
          return;
        }

        await wait(LOOP_PAUSE_MS);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loop, safeMessages]);

  return (
    <div className="w-[26rem] rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.1)]">
      <div className="mb-4 flex items-center gap-2 border-b border-[var(--c-border)]/60 pb-4">
        <div className="h-8 w-8 overflow-hidden rounded-lg">
          <img
            src="/logo.webp"
            alt="MatchWorky"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-[0.8rem] font-semibold text-[var(--c-text)]">
            MatchWorky
          </p>
          <p className="text-[0.72rem] text-[var(--c-text)]/50">
            {previewLabel}
          </p>
        </div>
        <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[26rem] space-y-3 overflow-y-auto pr-1"
      >
        {displayedMessages.map((message, index) => (
          <div key={`${index}-${message.from}`} className="animate-reveal">
            <Bubble from={message.from} text={message.text} />
          </div>
        ))}

        {isBotThinking ? <ThinkingBubble /> : null}

        {typingMessage && typingMessage.from === "bot" ? (
          <Bubble
            from="bot"
            text={typingMessage.text.slice(0, typedChars)}
            typing={typedChars < typingMessage.text.length}
          />
        ) : null}
      </div>
    </div>
  );
}

function Bubble({
  from,
  text,
  typing = false,
}: {
  from: "bot" | "user";
  text: string;
  typing?: boolean;
}) {
  if (from === "bot") {
    return (
      <div className="flex">
        <div className="max-w-[86%] rounded-xl rounded-tl-sm bg-[var(--c-bg)] px-3 py-2 text-[0.74rem] leading-relaxed text-[var(--c-text)]/85">
          {text.length > 0 ? text : null}
          {typing && text.length === 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/70 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/70 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/70 [animation-delay:240ms]" />
            </span>
          ) : null}
          {typing ? (
            <span className="ml-0.5 inline-block h-[0.8rem] w-[1px] animate-pulse align-[-2px] bg-[var(--c-text)]/70" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[82%] rounded-xl rounded-tr-sm bg-[var(--c-brand)] px-3 py-2 text-[0.74rem] leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-slate-700"
      style={{
        animation: `thinkingDot 1.3s ease-in-out ${delay} infinite`,
      }}
    />
  );
}

function ThinkingBubble() {
  return (
    <div className="flex animate-reveal">
      <div className="max-w-[86%] rounded-xl rounded-tl-sm bg-[var(--c-bg)] px-3 py-2.5">
        <div className="flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="160ms" />
          <Dot delay="320ms" />
        </div>
      </div>
    </div>
  );
}
