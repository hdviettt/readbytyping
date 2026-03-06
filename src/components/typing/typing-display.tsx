"use client";

import { memo } from "react";
import type { CharStatus } from "@/types/typing";

const CharSpan = memo(function CharSpan({
  char,
  status,
}: {
  char: string;
  status: CharStatus;
}) {
  const base = "font-typewriter text-lg";

  if (char === "\n") {
    return (
      <>
        <span
          className={`${base} ${
            status === "correct"
              ? "text-ink-correct"
              : status === "incorrect"
                ? "bg-ink-error/20 text-ink-error"
                : status === "current"
                  ? "bg-ink-current/20"
                  : "text-dim"
          }`}
        >
          {"\u21B5"}
        </span>
        <br />
      </>
    );
  }

  let cls = base;
  switch (status) {
    case "correct":
      cls += " text-ink-correct";
      break;
    case "incorrect":
      cls += " bg-ink-error/20 text-ink-error rounded-sm";
      break;
    case "current":
      cls += " bg-ink-current/25 border-l-2 border-ink-current";
      break;
    case "upcoming":
      cls += " text-dim";
      break;
  }

  return <span className={cls}>{char}</span>;
});

export function TypingDisplay({
  text,
  getCharStatus,
  onClick,
  streak = 0,
}: {
  text: string;
  getCharStatus: (index: number) => CharStatus;
  onClick: () => void;
  streak?: number;
}) {
  const glowColor =
    streak >= 100
      ? "rgba(196, 90, 74, 0.35)"
      : streak >= 50
        ? "rgba(200, 155, 60, 0.35)"
        : streak >= 25
          ? "rgba(200, 155, 60, 0.25)"
          : streak >= 10
            ? "rgba(200, 155, 60, 0.15)"
            : "none";

  const borderClass =
    streak >= 100
      ? "border-ink-error/40"
      : streak >= 50
        ? "border-accent/50"
        : streak >= 25
          ? "border-accent/35"
          : streak >= 10
            ? "border-accent/20"
            : "border-border";

  return (
    <div
      onClick={onClick}
      className={`font-typewriter text-lg leading-relaxed whitespace-pre-wrap cursor-text select-none p-6 bg-surface rounded-xl border min-h-[300px] transition-all duration-300 ${borderClass}`}
      style={{
        boxShadow: glowColor !== "none" ? `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}` : "none",
      }}
    >
      {text.split("").map((char, i) => (
        <CharSpan key={i} char={char} status={getCharStatus(i)} />
      ))}
    </div>
  );
}
