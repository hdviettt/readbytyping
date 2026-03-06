"use client";

import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { useStore } from "@/hooks/use-store";
import Link from "next/link";

export default function BookChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const { books, progress, loading } = useStore();

  const book = books.find((b) => b.id === params.id);
  const bookProgress = book ? progress[book.id] : null;

  if (loading) {
    return (
      <>
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-center text-muted py-12 animate-pulse font-typewriter">Loading...</p>
        </main>
      </>
    );
  }

  if (!book) {
    router.push("/");
    return null;
  }

  const completedPages = bookProgress?.completedPages || 0;
  let pagesBeforeChapter = 0;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Library
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold font-typewriter text-accent">{book.title}</h1>
          {book.author && (
            <p className="text-muted mt-1">{book.author}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted">
            <span>{book.totalChapters} chapters</span>
            <span>{book.totalPages} pages</span>
          </div>
        </div>

        {bookProgress && bookProgress.completedPages < book.totalPages && (
          <Link
            href={`/book/${book.id}/type?chapter=${bookProgress.chapterIndex}`}
            className="flex items-center justify-between w-full mb-6 px-5 py-4 bg-accent hover:bg-accent-hover text-background rounded-xl font-medium transition-colors"
          >
            <span>Resume typing</span>
            <span className="text-sm opacity-80">
              {Math.round((completedPages / book.totalPages) * 100)}% complete
            </span>
          </Link>
        )}

        <div className="space-y-2">
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

            return (
              <Link
                key={ci}
                href={`/book/${book.id}/type?chapter=${ci}`}
                className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-border-hover transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    isDone
                      ? "bg-ink-correct/20 text-ink-correct"
                      : "bg-paper text-muted group-hover:text-foreground"
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    ci + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {chapterPageCount} pages
                  </p>
                </div>

                {pct > 0 && !isDone && (
                  <div className="w-20 shrink-0">
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted text-right mt-0.5">
                      {pct}%
                    </p>
                  </div>
                )}

                <svg
                  className="w-5 h-5 text-dim group-hover:text-muted shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
