"use client";

import { useEffect, useRef } from "react";
import type { Book } from "@/types/book";

interface ChapterTocProps {
  book: Book;
  currentChapterIndex: number;
  completedPages: number;
  onSelectChapter: (chapterIndex: number) => void;
  onClose: () => void;
}

export function ChapterToc({
  book,
  currentChapterIndex,
  completedPages,
  onSelectChapter,
  onClose,
}: ChapterTocProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  // Scroll active chapter into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);

  let pagesBeforeChapter = 0;

  return (
    <div
      ref={panelRef}
      className="absolute left-0 right-0 top-full z-40 mt-px max-h-[60vh] overflow-y-auto bg-surface border border-border/60 rounded-b-xl shadow-lg"
    >
      <div className="px-3 py-2 border-b border-border/30 sticky top-0 bg-surface/95 backdrop-blur-sm">
        <p className="text-[11px] text-dim uppercase tracking-wider font-medium">
          Contents — {book.totalChapters} chapters
        </p>
      </div>
      <div className="py-1">
        {book.chapters.map((chapter, ci) => {
          const chapterPageCount = chapter.pages.length;
          const chapterStart = pagesBeforeChapter;
          pagesBeforeChapter += chapterPageCount;

          const completedInChapter = Math.max(
            0,
            Math.min(chapterPageCount, completedPages - chapterStart)
          );
          const pct =
            chapterPageCount > 0
              ? Math.round((completedInChapter / chapterPageCount) * 100)
              : 0;
          const isDone = pct === 100;
          const isCurrent = ci === currentChapterIndex;

          return (
            <button
              key={ci}
              ref={isCurrent ? activeRef : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onSelectChapter(ci);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                isCurrent
                  ? "bg-accent/10 border-l-2 border-accent"
                  : "hover:bg-border/15 border-l-2 border-transparent"
              }`}
            >
              {/* Chapter number / check */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-medium shrink-0 ${
                  isDone
                    ? "bg-ink-correct/10 text-ink-correct"
                    : isCurrent
                      ? "bg-accent/15 text-accent"
                      : "bg-border/20 text-muted"
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  ci + 1
                )}
              </div>

              {/* Title + page count */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] truncate ${
                    isCurrent ? "text-accent font-medium" : "text-foreground"
                  }`}
                >
                  {chapter.title}
                </p>
              </div>

              <span className="text-[11px] text-dim shrink-0 tabular-nums">
                {chapterPageCount} pg
              </span>

              {/* Progress indicator */}
              {pct > 0 && !isDone && (
                <div className="w-10 shrink-0">
                  <div className="w-full h-1 bg-border/30 rounded-full">
                    <div
                      className="h-full bg-accent/70 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
