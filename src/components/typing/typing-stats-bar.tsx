"use client";

import type { TypingStats } from "@/types/typing";

export function TypingStatsBar({
  stats,
  progress,
}: {
  stats: TypingStats;
  progress: { current: number; total: number; percentage: number };
}) {
  return (
    <div className="flex items-stretch gap-0 border border-border bg-surface">
      <StatField
        label="WPM"
        value={stats.wpm === 0 && stats.elapsedSeconds < 3 ? "--" : String(stats.wpm)}
        highlight
      />
      <StatField
        label="ACC"
        value={`${stats.accuracy}%`}
      />
      <div className="flex-1 border-l border-border px-4 py-1.5 flex items-center justify-end gap-3">
        <div className="w-24 h-1.5 bg-background border border-border">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted">
          {progress.current}/{progress.total}
        </span>
      </div>
    </div>
  );
}

function StatField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-r border-border px-3 py-1.5 min-w-[70px]">
      <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-dim mb-0.5">{label}</p>
      <p className={`text-lg font-bold font-typewriter leading-none ${highlight ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
