"use client";

interface ChapterNavProps {
  bookTitle: string;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
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
  onPrevPage,
  onNextPage,
  tocOpen,
  onToggleToc,
}: ChapterNavProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {onToggleToc && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleToc();
            }}
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors shrink-0 ${
              tocOpen
                ? "text-accent bg-accent/10"
                : "text-muted hover:text-foreground hover:bg-border/30"
            }`}
            title="Table of contents"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">{chapterTitle}</p>
          <p className="text-[11px] text-dim truncate">{bookTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-3">
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
  );
}
