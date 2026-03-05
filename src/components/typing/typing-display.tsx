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
  const base = "font-mono text-lg";

  if (char === "\n") {
    return (
      <>
        <span
          className={`${base} ${
            status === "correct"
              ? "text-green-400"
              : status === "incorrect"
                ? "bg-red-500/30 text-red-400"
                : status === "current"
                  ? "bg-blue-500/30"
                  : "text-zinc-600"
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
      cls += " text-green-400";
      break;
    case "incorrect":
      cls += " bg-red-500/30 text-red-400 rounded-sm";
      break;
    case "current":
      cls += " bg-blue-500/30 border-l-2 border-blue-400";
      break;
    case "upcoming":
      cls += " text-zinc-500";
      break;
  }

  return <span className={cls}>{char}</span>;
});

export function TypingDisplay({
  text,
  getCharStatus,
  onClick,
}: {
  text: string;
  getCharStatus: (index: number) => CharStatus;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="font-mono text-lg leading-relaxed whitespace-pre-wrap cursor-text select-none p-6 bg-zinc-900 rounded-xl border border-zinc-800 min-h-[300px]"
    >
      {text.split("").map((char, i) => (
        <CharSpan key={i} char={char} status={getCharStatus(i)} />
      ))}
    </div>
  );
}
