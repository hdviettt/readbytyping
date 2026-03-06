"use client";

import { useEffect, useRef } from "react";
import type { TypingStats } from "@/types/typing";
import { formatTime } from "@/lib/utils";
import { CountUp } from "@/components/count-up";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const titles = {
    page: "Page Complete!",
    chapter: "Chapter Complete!",
    book: "Book Complete!",
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onBackToBook}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto"
    >
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold font-typewriter text-accent text-center mb-6">
          {titles[type]}
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 bg-paper rounded-lg">
            <p className="text-2xl font-bold font-typewriter text-accent">
              <CountUp end={stats.wpm} />
            </p>
            <p className="text-xs text-muted mt-1">WPM</p>
          </div>
          <div className="text-center p-3 bg-paper rounded-lg">
            <p className="text-2xl font-bold font-typewriter text-ink-correct">
              <CountUp end={stats.accuracy} suffix="%" />
            </p>
            <p className="text-xs text-muted mt-1">Accuracy</p>
          </div>
          <div className="text-center p-3 bg-paper rounded-lg">
            <p className="text-2xl font-bold font-typewriter text-ink">
              {formatTime(stats.elapsedSeconds)}
            </p>
            <p className="text-xs text-muted mt-1">Time</p>
          </div>
        </div>

        <div className="space-y-3">
          {type !== "book" && (
            <button
              onClick={onContinue}
              className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-background rounded-lg font-medium transition-colors"
            >
              {type === "page" ? "Next Page" : "Next Chapter"}
            </button>
          )}
          <button
            onClick={onBackToBook}
            className="w-full py-3 px-4 border border-border hover:border-border-hover rounded-lg font-medium hover:bg-paper transition-colors"
          >
            Back to Book
          </button>
        </div>
      </div>
    </dialog>
  );
}
