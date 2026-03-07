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
          className={`font-mono text-[1em] ${cls}`}
          {...(status === "current" ? { "data-cursor": true } : {})}
        >
          {"\u21B5"}
        </span>
        <br />
      </>
    );
  }

  let cls = "font-mono text-[1em] ";

  switch (status) {
    case "correct":
      cls += "text-paper-text";
      break;
    case "incorrect":
      cls += "text-ink-error bg-ink-error/10";
      break;
    case "current":
      cls += "bg-accent text-white";
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
  isFocused = true,
}: {
  text: string;
  getCharStatus: (index: number) => CharStatus;
  onClick: () => void;
  cursor: number;
  fontSize?: number;
  isFocused?: boolean;
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

    if (cursorRelY > h * 0.3 && cursorRelY < h * 0.5) return;

    const targetY = h * 0.4;
    const cursorAbsY = cursorRelY + container.scrollTop;
    const scrollTarget = cursorAbsY - targetY;

    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: "smooth",
    });
  }, [cursor]);

  return (
    <div
      className="relative"
      style={{
        minHeight: "20rem",
        height: "55vh",
        maxHeight: "70vh",
      }}
    >
      <div
        onClick={onClick}
        ref={scrollRef}
        className={`book-page absolute inset-0 cursor-text select-none overflow-hidden transition-all duration-200 ${
          isFocused
            ? "ring-1 ring-accent/40"
            : "ring-1 ring-transparent"
        }`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="px-8 py-6 pb-40 leading-[1.8] whitespace-pre-wrap">
          {text.split("").map((char, i) => (
            <CharSpan key={i} char={char} status={getCharStatus(i)} />
          ))}
        </div>
      </div>

      {/* Focus prompt */}
      {!isFocused && (
        <div
          onClick={onClick}
          className="absolute inset-x-0 bottom-0 z-10 flex justify-center py-3 cursor-pointer bg-gradient-to-t from-paper-bg to-transparent"
        >
          <span className="text-xs tracking-wide text-paper-text/40">Click to continue typing</span>
        </div>
      )}
    </div>
  );
}
