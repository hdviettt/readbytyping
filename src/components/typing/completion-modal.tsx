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

  return (
    <dialog
      ref={dialogRef}
      onClose={onBackToBook}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto"
    >
      <div className="bg-surface border border-border/70 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Session Complete</p>
          <span className="badge badge-accent animate-badge">
            {type === "book" ? "Finished" : "Done"}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 border-b border-border/50">
          <div className="px-4 py-5 text-center border-r border-border/50">
            <p className="text-xs text-dim mb-1">WPM</p>
            <p className="text-2xl font-mono tabular-nums font-semibold text-accent">
              <CountUp end={stats.wpm} />
            </p>
          </div>
          <div className="px-4 py-5 text-center border-r border-border/50">
            <p className="text-xs text-dim mb-1">Accuracy</p>
            <p className="text-2xl font-mono tabular-nums font-semibold text-ink-correct">
              <CountUp end={stats.accuracy} suffix="%" />
            </p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-dim mb-1">Time</p>
            <p className="text-2xl font-mono tabular-nums font-semibold text-foreground">
              {formatTime(stats.elapsedSeconds)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2">
          {type !== "book" && (
            <button
              onClick={onContinue}
              className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-background font-medium text-sm transition-colors"
            >
              Next Chapter
            </button>
          )}
          <button
            onClick={onBackToBook}
            className="flex-1 py-2.5 bg-border/30 hover:bg-border/50 font-medium text-sm transition-colors"
          >
            Back to Book
          </button>
        </div>
      </div>
    </dialog>
  );
}
