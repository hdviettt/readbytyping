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
    <div className="flex items-center justify-between border border-border bg-surface px-4 py-1.5">
      <div>
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim">Document</p>
        <p className="text-sm font-bold font-typewriter text-foreground">{chapterTitle}</p>
        <p className="text-[10px] text-muted tracking-wider uppercase">{bookTitle}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevPage}
          disabled={!onPrevPage}
          className="w-7 h-7 flex items-center justify-center border border-border hover:border-border-hover disabled:opacity-20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted min-w-[70px] text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={!onNextPage}
          className="w-7 h-7 flex items-center justify-center border border-border hover:border-border-hover disabled:opacity-20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
