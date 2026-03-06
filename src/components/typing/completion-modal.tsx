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

  const stamps = {
    page: "Processed",
    chapter: "Cleared",
    book: "Completed",
  };

  const titles = {
    page: "Page processed successfully",
    chapter: "Chapter clearance granted",
    book: "Full document processed",
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onBackToBook}
      className="backdrop:bg-black/70 bg-transparent p-0 m-auto"
    >
      <div className="bg-surface border-2 border-border max-w-sm w-full mx-4">
        {/* Header */}
        <div className="border-b-2 border-border px-6 py-3 flex items-center justify-between">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim">
            Processing Report
          </p>
          <span className="stamp animate-stamp text-sm">
            {stamps[type]}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 border-b-2 border-border">
          <div className="px-4 py-4 text-center border-r-2 border-border">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim mb-1">WPM</p>
            <p className="text-2xl font-bold font-typewriter text-accent">
              <CountUp end={stats.wpm} />
            </p>
          </div>
          <div className="px-4 py-4 text-center border-r-2 border-border">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim mb-1">Accuracy</p>
            <p className="text-2xl font-bold font-typewriter text-ink-correct">
              <CountUp end={stats.accuracy} suffix="%" />
            </p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim mb-1">Time</p>
            <p className="text-2xl font-bold font-typewriter text-foreground">
              {formatTime(stats.elapsedSeconds)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-3 border-b-2 border-border">
          <p className="text-xs text-muted text-center tracking-wider uppercase">
            {titles[type]}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          {type !== "book" && (
            <button
              onClick={onContinue}
              className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-background font-bold text-[11px] tracking-[0.15em] uppercase transition-colors border-2 border-accent hover:border-accent-hover"
            >
              {type === "page" ? "Next Document" : "Next Section"}
            </button>
          )}
          <button
            onClick={onBackToBook}
            className="flex-1 py-2.5 border-2 border-border hover:border-border-hover font-bold text-[11px] tracking-[0.15em] uppercase hover:bg-paper transition-colors"
          >
            Return to File
          </button>
        </div>
      </div>
    </dialog>
  );
}
