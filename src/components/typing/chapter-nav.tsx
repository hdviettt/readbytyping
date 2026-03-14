"use client";

interface ChapterNavProps {
  bookTitle: string;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  chapterNumber: number;
  totalChapters: number;
  bookProgressPct: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  tocOpen?: boolean;
  onToggleToc?: () => void;
}

export function ChapterNav({
  bookTitle,
  chapterTitle,
  currentPage,
  totalPages,
  chapterNumber,
  totalChapters,
  bookProgressPct,
  onPrevPage,
  onNextPage,
  tocOpen,
  onToggleToc,
}: ChapterNavProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-1.5">
        {/* Clickable chapter title area — opens TOC */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleToc?.();
          }}
          className="flex items-center gap-2 min-w-0 group text-left"
        >
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors shrink-0 ${
              tocOpen
                ? "text-accent bg-accent/10"
                : "text-muted group-hover:text-foreground group-hover:bg-border/30"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate group-hover:text-accent transition-colors">
              {chapterTitle}
            </p>
            <p className="text-[11px] text-dim truncate">{bookTitle}</p>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Chapter indicator */}
          <span className="text-[11px] text-dim tabular-nums font-mono hidden sm:inline">
            Ch {chapterNumber}/{totalChapters}
          </span>
          <span className="text-border hidden sm:inline">·</span>

          <button
            onClick={onPrevPage}
            disabled={!onPrevPage}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground hover:bg-border/30 rounded-md disabled:opacity-20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[11px] text-muted tabular-nums min-w-[56px] text-center font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={!onNextPage}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground hover:bg-border/30 rounded-md disabled:opacity-20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Book progress bar */}
      <div className="px-4 pb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-border/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/60 rounded-full transition-all duration-500"
              style={{ width: `${bookProgressPct}%` }}
            />
          </div>
          <span className="text-[11px] text-dim tabular-nums font-mono shrink-0">
            {bookProgressPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
