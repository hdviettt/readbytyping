"use client";

import type { TypingStats } from "@/types/typing";
import { formatTime } from "@/lib/utils";

export function TypingStatsBar({
  stats,
  progress,
}: {
  stats: TypingStats;
  progress: { current: number; total: number; percentage: number };
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-border">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold font-typewriter text-accent">{stats.wpm}</p>
          <p className="text-xs text-muted">WPM</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-typewriter text-ink-correct">{stats.accuracy}%</p>
          <p className="text-xs text-muted">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-typewriter text-ink">
            {formatTime(stats.elapsedSeconds)}
          </p>
          <p className="text-xs text-muted">Time</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium font-typewriter">{progress.percentage}%</p>
          <p className="text-xs text-muted">
            {progress.current} / {progress.total}
          </p>
        </div>
        <div className="w-24 h-2 bg-paper rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
