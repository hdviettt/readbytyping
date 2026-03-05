"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { getBook, getProgress } from "@/lib/store";
import type { Book, ReadingProgress } from "@/types/book";
import Link from "next/link";

export default function BookChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    const b = getBook(params.id as string);
    if (!b) {
      router.push("/");
      return;
    }
    setBook(b);
    setProgress(getProgress(b.id));
  }, [params.id, router]);

  if (!book) return null;

  // Figure out which pages are completed per chapter
  const completedPages = progress?.completedPages || 0;
  let pagesBeforeChapter = 0;

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6"
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
          <h1 className="text-2xl font-bold">{book.title}</h1>
          {book.author && (
            <p className="text-zinc-500 mt-1">{book.author}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
            <span>{book.totalChapters} chapters</span>
            <span>{book.totalPages} pages</span>
          </div>
        </div>

        {/* Resume button if there's progress */}
        {progress && progress.completedPages < book.totalPages && (
          <Link
            href={`/book/${book.id}/type?chapter=${progress.chapterIndex}`}
            className="flex items-center justify-between w-full mb-6 px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <span>Resume typing</span>
            <span className="text-sm text-blue-200">
              {Math.round((completedPages / book.totalPages) * 100)}% complete
            </span>
          </Link>
        )}

        <div className="space-y-2">
          {book.chapters.map((chapter, ci) => {
            const chapterPageCount = chapter.pages.length;
            const chapterStart = pagesBeforeChapter;
            pagesBeforeChapter += chapterPageCount;

            // How many of this chapter's pages are completed
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
                className="flex items-center gap-4 p-4 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors group"
              >
                {/* Chapter number / check */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    isDone
                      ? "bg-green-600/20 text-green-400"
                      : "bg-zinc-800 text-zinc-400 group-hover:text-white"
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
                  <p className="font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {chapterPageCount} pages
                  </p>
                </div>

                {/* Progress bar */}
                {pct > 0 && !isDone && (
                  <div className="w-20 shrink-0">
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-right mt-0.5">
                      {pct}%
                    </p>
                  </div>
                )}

                <svg
                  className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 shrink-0"
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
