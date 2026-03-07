"use client";

import type { KeystrokeStat } from "@/types/typing";

const ROWS = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

function accuracyColor(acc: number): string {
  if (acc >= 0.98) return "bg-ink-correct/50";
  if (acc >= 0.95) return "bg-ink-correct/30";
  if (acc >= 0.9) return "bg-accent/30";
  if (acc >= 0.8) return "bg-accent/20";
  return "bg-ink-error/40";
}

export function KeyHeatmap({ stats }: { stats: KeystrokeStat[] }) {
  const map = new Map(stats.map((s) => [s.character, s]));

  if (stats.length === 0) {
    return (
      <p className="text-center text-sm text-muted py-8">
        Type through some text to see your key accuracy
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {ROWS.map((row, ri) => (
        <div
          key={ri}
          className="flex gap-1.5 justify-center"
          style={{ paddingLeft: `${ri * 16}px` }}
        >
          {row.map((key) => {
            const stat = map.get(key) || map.get(key.toUpperCase());
            const acc =
              stat && stat.totalAttempts > 0
                ? stat.correctAttempts / stat.totalAttempts
                : null;

            return (
              <div
                key={key}
                className={`w-10 h-10 flex items-center justify-center text-sm font-mono border border-border ${
                  acc !== null ? accuracyColor(acc) : "bg-paper/50"
                }`}
                title={
                  stat
                    ? `${key}: ${Math.round((acc || 0) * 100)}% (${stat.totalAttempts} tries)`
                    : key
                }
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-ink-correct/50" /> 98%+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-accent/30" /> 90-95%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-ink-error/40" /> &lt;80%
        </span>
      </div>
    </div>
  );
}
