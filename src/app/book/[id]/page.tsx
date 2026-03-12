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
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="py-12 space-y-3 max-w-lg mx-auto animate-pulse">
            <div className="h-3 bg-border/30 rounded-full w-3/4" />
            <div className="h-3 bg-border/30 rounded-full w-1/2" />
            <div className="h-3 bg-border/30 rounded-full w-2/3" />
          </div>
        </main>
      </>
    );
  }

  if (!book) {
    router.push("/");
    return null;
  }

  const completedPages = bookProgress?.completedPages || 0;
  const overallPct = book.totalPages > 0 ? Math.round((completedPages / book.totalPages) * 100) : 0;
  let pagesBeforeChapter = 0;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Library
        </Link>

        {/* Book header with progress */}
        <div className="mb-8 p-5 bg-surface/50 border border-border/50 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">{book.title}</h1>
              {book.author && (
                <p className="text-muted text-[13px] mt-1">{book.author}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[13px] text-dim">
                <span>{book.totalChapters} chapters</span>
                <span className="text-border">·</span>
                <span>{book.totalPages} pages</span>
              </div>
            </div>
            {/* Circular-ish progress indicator */}
            <div className="shrink-0 text-center">
              <p className="text-3xl font-mono tabular-nums font-bold text-accent">{overallPct}%</p>
              <p className="text-[11px] text-dim mt-0.5">{completedPages}/{book.totalPages} pg</p>
            </div>
          </div>

          {/* Full-width progress bar */}
          {overallPct > 0 && overallPct < 100 && (
            <div className="mt-4 w-full h-1 bg-border/30 rounded-full">
              <div className="h-full bg-accent/70 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          )}

          {bookProgress && bookProgress.completedPages < book.totalPages && (
            <Link
              href={`/book/${book.id}/type?chapter=${bookProgress.chapterIndex}`}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-accent hover:bg-accent-hover text-background font-medium text-sm rounded-full transition-all"
            >
              Resume typing
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Chapter list */}
        <div className="space-y-1">
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
                className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-surface/50 transition-colors group border border-transparent hover:border-border/40"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 ${
                    isDone
                      ? "bg-ink-correct/10 text-ink-correct"
                      : "bg-border/20 text-muted group-hover:text-foreground"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    ci + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate group-hover:text-accent transition-colors">
                    {chapter.title}
                  </p>
                </div>

                <span className="text-[11px] text-dim shrink-0">{chapterPageCount} pg</span>

                {pct > 0 && !isDone && (
                  <div className="w-12 shrink-0">
                    <div className="w-full h-1 bg-border/30 rounded-full">
                      <div
                        className="h-full bg-accent/70 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <svg
                  className="w-4 h-4 text-border group-hover:text-muted shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
