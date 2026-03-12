"use client";

interface ChapterNavProps {
  bookTitle: string;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

export function ChapterNav({
  bookTitle,
  chapterTitle,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
}: ChapterNavProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] font-serif font-medium text-foreground truncate">{chapterTitle}</p>
        <p className="text-[11px] text-dim truncate">{bookTitle}</p>
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
