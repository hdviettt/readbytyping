"use client";

import { memo, useRef, useEffect } from "react";
import type { CharStatus } from "@/types/typing";

const CharSpan = memo(function CharSpan({
  char,
  status,
}: {
  char: string;
  status: CharStatus;
}) {
  if (char === "\n") {
    const cls =
      status === "correct"
        ? "text-paper-text/30"
        : status === "incorrect"
          ? "text-ink-error"
          : status === "current"
            ? "text-paper-text"
            : "text-paper-upcoming/50";

    return (
      <>
        <span
          className={`font-typewriter text-[1em] ${cls}`}
          {...(status === "current" ? { "data-cursor": true } : {})}
        >
          {"\u21B5"}
        </span>
        <br />
      </>
    );
  }

  let cls = "font-typewriter text-[1em] ";

  switch (status) {
    case "correct":
      cls += "text-paper-text";
      break;
    case "incorrect":
      cls += "text-ink-error bg-ink-error/15";
      break;
    case "current":
      cls += "text-paper-bg bg-paper-text";
      break;
    case "upcoming":
      cls += "text-paper-upcoming";
      break;
  }

  return (
    <span
      className={cls}
      {...(status === "current" ? { "data-cursor": true } : {})}
    >
      {char}
    </span>
  );
});

export function TypingDisplay({
  text,
  getCharStatus,
  onClick,
  cursor,
  fontSize = 17,
}: {
  text: string;
  getCharStatus: (index: number) => CharStatus;
  onClick: () => void;
  cursor: number;
  fontSize?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cursorEl = container.querySelector("[data-cursor]") as HTMLElement;
    if (!cursorEl) return;

    const containerRect = container.getBoundingClientRect();
    const cursorRect = cursorEl.getBoundingClientRect();
    const cursorRelY = cursorRect.top - containerRect.top;
    const h = containerRect.height;

    if (cursorRelY > h * 0.2 && cursorRelY < h * 0.6) return;

    const targetY = h * 0.4;
    const cursorAbsY = cursorRelY + container.scrollTop;
    const scrollTarget = cursorAbsY - targetY;

    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: "instant",
    });
  }, [cursor]);

  return (
    <div
      onClick={onClick}
      ref={scrollRef}
      className="book-page relative cursor-text select-none overflow-hidden doc-border"
      style={{ minHeight: "20rem", height: "55vh", maxHeight: "70vh", fontSize: `${fontSize}px` }}
    >
      {/* Text content */}
      <div className="px-8 py-6 pb-40 leading-[1.5rem] whitespace-pre-wrap relative z-10">
        {text.split("").map((char, i) => (
          <CharSpan key={i} char={char} status={getCharStatus(i)} />
        ))}
      </div>
    </div>
  );
}
