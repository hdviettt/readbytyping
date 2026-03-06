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
    <div className="flex items-end justify-between">
      <div className="flex items-end gap-8">
        <div>
          <p className="text-3xl font-bold font-typewriter text-accent leading-none">
            {stats.wpm === 0 && stats.elapsedSeconds < 3 ? "--" : stats.wpm}
          </p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-widest">wpm</p>
        </div>
        <div>
          <p className="text-3xl font-bold font-typewriter text-ink-correct leading-none">
            {stats.accuracy}<span className="text-lg">%</span>
          </p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-widest">accuracy</p>
        </div>
        <div>
          <p className="text-3xl font-bold font-typewriter text-foreground/60 leading-none">
            {formatTime(stats.elapsedSeconds)}
          </p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-widest">time</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm font-typewriter text-muted">
          {progress.current}<span className="text-dim"> / {progress.total}</span>
        </p>
        <div className="w-28 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
