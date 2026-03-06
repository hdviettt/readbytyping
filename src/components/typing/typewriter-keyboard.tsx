"use client";

import { memo, useEffect, useState } from "react";

const ROWS = [
  [
    { key: "`", w: 1 },
    { key: "1", w: 1 },
    { key: "2", w: 1 },
    { key: "3", w: 1 },
    { key: "4", w: 1 },
    { key: "5", w: 1 },
    { key: "6", w: 1 },
    { key: "7", w: 1 },
    { key: "8", w: 1 },
    { key: "9", w: 1 },
    { key: "0", w: 1 },
    { key: "-", w: 1 },
    { key: "=", w: 1 },
  ],
  [
    { key: "q", w: 1 },
    { key: "w", w: 1 },
    { key: "e", w: 1 },
    { key: "r", w: 1 },
    { key: "t", w: 1 },
    { key: "y", w: 1 },
    { key: "u", w: 1 },
    { key: "i", w: 1 },
    { key: "o", w: 1 },
    { key: "p", w: 1 },
    { key: "Backspace", label: "DEL", w: 1.4 },
  ],
  [
    { key: "a", w: 1 },
    { key: "s", w: 1 },
    { key: "d", w: 1 },
    { key: "f", w: 1 },
    { key: "g", w: 1 },
    { key: "h", w: 1 },
    { key: "j", w: 1 },
    { key: "k", w: 1 },
    { key: "l", w: 1 },
    { key: "Enter", label: "RET", w: 1.4 },
  ],
  [
    { key: "ShiftLeft", label: "SHIFT", w: 1.4 },
    { key: "z", w: 1 },
    { key: "x", w: 1 },
    { key: "c", w: 1 },
    { key: "v", w: 1 },
    { key: "b", w: 1 },
    { key: "n", w: 1 },
    { key: "m", w: 1 },
    { key: "ShiftRight", label: "SHIFT", w: 1.4 },
  ],
  [
    { key: ",", w: 1 },
    { key: ".", w: 1 },
    { key: " ", label: "", w: 6 },
    { key: ";", w: 1 },
    { key: "'", w: 1 },
  ],
];

const ALL_KEYS = [
  { key: "`", shift: "~" }, { key: "1", shift: "!" }, { key: "2", shift: "@" },
  { key: "3", shift: "#" }, { key: "4", shift: "$" }, { key: "5", shift: "%" },
  { key: "6", shift: "^" }, { key: "7", shift: "&" }, { key: "8", shift: "*" },
  { key: "9", shift: "(" }, { key: "0", shift: ")" }, { key: "-", shift: "_" },
  { key: "=", shift: "+" }, { key: "[", shift: "{" }, { key: "]", shift: "}" },
  { key: "\\", shift: "|" }, { key: "'", shift: '"' }, { key: "/", shift: "?" },
  { key: ",", shift: "<" }, { key: ".", shift: ">" }, { key: ";", shift: ":" },
];

function charToKey(char: string): string {
  if (char === "\n") return "Enter";
  if (char === " ") return " ";
  for (const row of ROWS) {
    for (const k of row) {
      if (k.key === char) return k.key;
    }
  }
  for (const k of ALL_KEYS) {
    if (k.key === char || k.shift === char) return k.key;
  }
  return char.toLowerCase();
}

function isShiftNeeded(char: string): boolean {
  if (char >= "A" && char <= "Z") return true;
  for (const k of ALL_KEYS) {
    if (k.shift === char) return true;
  }
  return false;
}

const KeyCap = memo(function KeyCap({
  keyDef,
  isExpected,
  isShiftExpected,
  flashState,
}: {
  keyDef: { key: string; label?: string; w: number };
  isExpected: boolean;
  isShiftExpected: boolean;
  flashState: "correct" | "incorrect" | null;
}) {
  const isLetter = keyDef.key.length === 1 && /[a-z]/.test(keyDef.key);
  const display = keyDef.label ?? (isLetter ? keyDef.key.toUpperCase() : keyDef.key);
  const isShiftKey = keyDef.key === "ShiftLeft" || keyDef.key === "ShiftRight";
  const isSpace = keyDef.key === " ";
  const highlight = isExpected || (isShiftKey && isShiftExpected);

  // Pressed state
  const pressed = !!flashState;

  // Colors
  let textCls = "text-key-text";
  let borderColor = "var(--key-border)";
  let bgColor = "var(--key-bg)";

  if (flashState === "correct") {
    textCls = "text-ink-correct";
    borderColor = "var(--ink-correct)";
    bgColor = "rgba(106, 154, 80, 0.15)";
  } else if (flashState === "incorrect") {
    textCls = "text-ink-error";
    borderColor = "var(--ink-error)";
    bgColor = "rgba(196, 74, 58, 0.15)";
  } else if (highlight) {
    textCls = "text-accent";
    borderColor = "var(--accent)";
    bgColor = "rgba(184, 164, 76, 0.12)";
  }

  return (
    <div
      className={`${textCls} flex items-center justify-center font-typewriter select-none transition-all duration-75`}
      style={{
        width: `${keyDef.w * 2.6}rem`,
        height: isSpace ? "2rem" : "2.4rem",
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: pressed
          ? `inset 0 1px 3px rgba(0,0,0,0.4)`
          : `0 2px 0 var(--key-shadow), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: pressed ? "translateY(2px)" : "none",
      }}
    >
      <span className={`${keyDef.label ? "text-[8px] tracking-[0.15em]" : "text-xs"} font-bold`}>
        {display}
      </span>
    </div>
  );
});

export function TypewriterKeyboard({
  expectedChar,
  lastAction,
}: {
  expectedChar: string | null;
  lastAction: { key: string; correct: boolean; timestamp: number } | null;
}) {
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    if (!lastAction) return;

    const pressedKey = lastAction.key === "Backspace"
      ? "Backspace"
      : lastAction.key === "Enter" || lastAction.key === "\n"
        ? "Enter"
        : charToKey(lastAction.key);

    setFlashKey(pressedKey);
    setFlashState(lastAction.correct ? "correct" : "incorrect");

    const timeout = setTimeout(() => {
      setFlashKey(null);
      setFlashState(null);
    }, 80);

    return () => clearTimeout(timeout);
  }, [lastAction]);

  const expectedKey = expectedChar ? charToKey(expectedChar) : null;
  const shiftNeeded = expectedChar ? isShiftNeeded(expectedChar) : false;

  return (
    <div
      className="border-2 border-t-0 border-border"
      style={{
        background: "linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
        padding: "12px 16px 16px",
      }}
    >
      {/* Metal tray top edge */}
      <div className="h-px bg-border-hover/30 mb-3" />

      <div className="flex flex-col items-center gap-[2px]">
        {ROWS.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-[2px]"
            style={{ paddingLeft: ri === 1 ? "0.8rem" : ri === 2 ? "0.4rem" : 0 }}
          >
            {row.map((keyDef, ki) => (
              <KeyCap
                key={ki}
                keyDef={keyDef}
                isExpected={expectedKey === keyDef.key}
                isShiftExpected={shiftNeeded}
                flashState={flashKey === keyDef.key ? flashState : null}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
