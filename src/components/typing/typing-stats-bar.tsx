"use client";

import { useRef, useEffect } from "react";
import type { TypingStats } from "@/types/typing";
import { getTier } from "./streak-effects";

export function TypingStatsBar({
  stats,
  progress,
  streak = 0,
  saveStatus = "idle",
}: {
  stats: TypingStats;
  progress: { current: number; total: number; percentage: number };
  streak?: number;
  saveStatus?: "idle" | "saved" | "error";
}) {
  const tier = streak >= 5 ? getTier(streak) : null;
  const prevTierLabelRef = useRef("");
  const tierLabel = tier?.label || "";
  const tierChanged = tierLabel !== prevTierLabelRef.current && tierLabel !== "";

  useEffect(() => {
    prevTierLabelRef.current = tierLabel;
  }, [tierLabel]);

  return (
    <div className="flex items-stretch gap-0 border border-border bg-surface rounded-lg">
      <StatField
        label="WPM"
        value={stats.wpm === 0 && stats.elapsedSeconds < 3 ? "--" : String(stats.wpm)}
        highlight
      />
      <StatField
        label="Accuracy"
        value={`${stats.accuracy}%`}
      />
      {tier && (
        <div className="border-l border-border px-3 py-1.5 min-w-[60px]">
          <p className="text-xs text-muted mb-0.5">Streak</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-semibold font-mono leading-none tabular-nums ${tier.color}`}
              style={{ fontSize: `${Math.min(1.1 + streak * 0.005, 1.5)}rem` }}
            >
              {streak}x
            </span>
            {tierLabel && (
              <span
                key={tierLabel}
                className={`text-xs font-semibold ${tier.color} opacity-80 ${tierChanged ? "animate-streak-flash" : ""}`}
              >
                {tierLabel}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 border-l border-border px-4 py-1.5 flex items-center justify-end gap-3">
        {saveStatus === "saved" && (
          <span className="text-xs font-medium text-ink-correct opacity-70 transition-opacity">
            Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-xs font-medium text-ink-error">
            Save failed
          </span>
        )}
        <div className="w-24 h-1.5 bg-background rounded-full">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted">
          {progress.current}/{progress.total}
        </span>
      </div>
    </div>
  );
}

function StatField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-r border-border px-3 py-1.5 min-w-[70px]">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className={`text-xl font-semibold font-mono leading-none tabular-nums ${highlight ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
