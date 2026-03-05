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
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.wpm}</p>
          <p className="text-xs text-zinc-500">WPM</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{stats.accuracy}%</p>
          <p className="text-xs text-zinc-500">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-300">
            {formatTime(stats.elapsedSeconds)}
          </p>
          <p className="text-xs text-zinc-500">Time</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{progress.percentage}%</p>
          <p className="text-xs text-zinc-500">
            {progress.current} / {progress.total}
          </p>
        </div>
        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
