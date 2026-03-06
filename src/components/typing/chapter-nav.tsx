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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">{bookTitle}</p>
        <p className="font-medium font-typewriter">{chapterTitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={!onPrevPage}
          className="p-2 rounded-lg hover:bg-paper disabled:opacity-30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium font-typewriter min-w-[80px] text-center">
          Page {currentPage} / {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={!onNextPage}
          className="p-2 rounded-lg hover:bg-paper disabled:opacity-30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
