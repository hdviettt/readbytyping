"use client";

import type { TypingStats } from "@/types/typing";
import { formatTime } from "@/lib/utils";

export function CompletionModal({
  type,
  stats,
  onContinue,
  onBackToBook,
}: {
  type: "page" | "chapter" | "book";
  stats: TypingStats;
  onContinue: () => void;
  onBackToBook: () => void;
}) {
  const titles = {
    page: "Page Complete!",
    chapter: "Chapter Complete!",
    book: "Book Complete!",
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          {titles[type]}
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 bg-zinc-800 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{stats.wpm}</p>
            <p className="text-xs text-zinc-500 mt-1">WPM</p>
          </div>
          <div className="text-center p-3 bg-zinc-800 rounded-lg">
            <p className="text-2xl font-bold text-green-400">
              {stats.accuracy}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
          </div>
          <div className="text-center p-3 bg-zinc-800 rounded-lg">
            <p className="text-2xl font-bold text-zinc-300">
              {formatTime(stats.elapsedSeconds)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Time</p>
          </div>
        </div>

        <div className="space-y-3">
          {type !== "book" && (
            <button
              onClick={onContinue}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {type === "page" ? "Next Page" : "Next Chapter"}
            </button>
          )}
          <button
            onClick={onBackToBook}
            className="w-full py-3 px-4 border border-zinc-700 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            {type === "book" ? "Back to Library" : "Back to Library"}
          </button>
        </div>
      </div>
    </div>
  );
}
