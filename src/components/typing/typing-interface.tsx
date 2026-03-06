"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@/types/book";
import {
  getProgress,
  saveProgress,
  saveSession,
  updateKeystrokeStats,
} from "@/lib/store";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import {
  calculateSessionWpm,
  calculateAccuracy,
  generateWpmSamples,
  calculateWpm,
} from "@/lib/typing/wpm";
import { TypingDisplay } from "./typing-display";
import { TypingStatsBar } from "./typing-stats-bar";
import { ChapterNav } from "./chapter-nav";
import { CompletionModal } from "./completion-modal";
import { StreakEffects } from "./streak-effects";

export function TypingInterface({
  book,
  startChapterIndex,
}: {
  book: Book;
  startChapterIndex: number;
}) {
  const router = useRouter();

  const progress = getProgress(book.id);

  // Use saved progress if we're resuming the same chapter, otherwise start fresh
  const resuming =
    progress && progress.chapterIndex === startChapterIndex;
  const initialPageIndex = resuming ? progress.pageIndex : 0;

  const [chapterIndex, setChapterIndex] = useState(startChapterIndex);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [completionType, setCompletionType] = useState<
    "page" | "chapter" | "book" | null
  >(null);

  const chapter = book.chapters[chapterIndex];
  const page = chapter?.pages[pageIndex];

  const startOffset =
    resuming && chapterIndex === startChapterIndex && pageIndex === initialPageIndex
      ? progress.charOffset || 0
      : 0;

  const {
    state,
    stats,
    charStatuses,
    progress: pageProgress,
    handleKeyDown,
    inputRef,
    focusInput,
  } = useTypingEngine(page?.content || "", startOffset);

  const typingContainerRef = useRef<HTMLDivElement>(null);

  // Track peak WPM for session
  const peakWpmRef = useRef(0);
  useEffect(() => {
    if (stats.wpm > peakWpmRef.current) peakWpmRef.current = stats.wpm;
  }, [stats.wpm]);

  // Compute total page index across all chapters
  const globalPageIndex = (() => {
    let total = 0;
    for (let ci = 0; ci < chapterIndex; ci++) {
      total += book.chapters[ci].pages.length;
    }
    return total + pageIndex;
  })();

  // Auto-save progress debounced
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSaveProgress = useCallback(
    (charOffset: number, completed: boolean = false) => {
      saveProgress({
        bookId: book.id,
        chapterIndex,
        pageIndex,
        charOffset,
        completedPages: completed ? globalPageIndex + 1 : globalPageIndex,
        lastTypedAt: Date.now(),
      });
    },
    [book.id, chapterIndex, pageIndex, globalPageIndex]
  );

  useEffect(() => {
    if (state.cursor > 0 && !state.isComplete) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        doSaveProgress(state.cursor);
      }, 10000);
    }
    return () => clearTimeout(saveTimeoutRef.current);
  }, [state.cursor, state.isComplete, doSaveProgress]);

  // Save on visibility change
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && state.cursor > 0) doSaveProgress(state.cursor);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.cursor, doSaveProgress]);

  // Handle page completion
  useEffect(() => {
    if (!state.isComplete) return;

    doSaveProgress(state.cursor, true);

    // Save session record
    if (state.startedAt && state.lastKeystrokeAt) {
      const duration = state.lastKeystrokeAt - state.startedAt;
      const samples = generateWpmSamples(state);

      saveSession({
        id: crypto.randomUUID(),
        bookId: book.id,
        bookTitle: book.title,
        startedAt: state.startedAt,
        endedAt: state.lastKeystrokeAt,
        durationSeconds: Math.round(duration / 1000),
        totalCharactersTyped: state.totalTyped,
        correctCharacters: state.correctCount,
        incorrectCharacters: state.incorrectCount,
        avgWpm: calculateSessionWpm(state),
        peakWpm: peakWpmRef.current,
        accuracy: calculateAccuracy(state) / 100,
        wpmSamples: samples,
      });

      // Update keystroke stats
      const charMap = new Map<
        string,
        { correct: number; incorrect: number }
      >();
      for (const k of state.keystrokes) {
        const prev = charMap.get(k.expected) || {
          correct: 0,
          incorrect: 0,
        };
        if (k.correct) prev.correct++;
        else prev.incorrect++;
        charMap.set(k.expected, prev);
      }
      updateKeystrokeStats(charMap);

      peakWpmRef.current = 0;
    }

    // Determine completion type
    const isLastPageInChapter = pageIndex === chapter.pages.length - 1;
    const isLastChapter = chapterIndex === book.chapters.length - 1;

    if (isLastPageInChapter && isLastChapter) {
      setCompletionType("book");
    } else if (isLastPageInChapter) {
      setCompletionType("chapter");
    } else {
      setCompletionType("page");
    }
  }, [state.isComplete]);

  function handleContinue() {
    setCompletionType(null);
    if (pageIndex < chapter.pages.length - 1) {
      setPageIndex(pageIndex + 1);
    } else if (chapterIndex < book.chapters.length - 1) {
      setChapterIndex(chapterIndex + 1);
      setPageIndex(0);
    }
  }

  if (!page) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <ChapterNav
        bookTitle={book.title}
        chapterTitle={chapter.title}
        currentPage={globalPageIndex + 1}
        totalPages={book.totalPages}
        onPrevPage={
          globalPageIndex > 0
            ? () => {
                if (pageIndex > 0) {
                  setPageIndex(pageIndex - 1);
                } else if (chapterIndex > 0) {
                  const prevChapter = book.chapters[chapterIndex - 1];
                  setChapterIndex(chapterIndex - 1);
                  setPageIndex(prevChapter.pages.length - 1);
                }
              }
            : undefined
        }
        onNextPage={
          globalPageIndex < book.totalPages - 1
            ? () => {
                if (pageIndex < chapter.pages.length - 1) {
                  setPageIndex(pageIndex + 1);
                } else if (chapterIndex < book.chapters.length - 1) {
                  setChapterIndex(chapterIndex + 1);
                  setPageIndex(0);
                }
              }
            : undefined
        }
      />

      <TypingStatsBar stats={stats} progress={pageProgress} />

      <div className="relative" ref={typingContainerRef} onClick={focusInput}>
        <TypingDisplay
          text={page.content}
          getCharStatus={charStatuses}
          onClick={focusInput}
          streak={state.streak}
        />
        <StreakEffects
          streak={state.streak}
          containerRef={typingContainerRef}
        />
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="absolute top-0 left-0 w-0 h-0 opacity-0"
          autoFocus
          aria-label="Type here"
        />
      </div>

      {!state.startedAt && !state.isComplete && (
        <p className="text-center text-sm text-muted animate-pulse font-typewriter">
          Click the text and start typing...
        </p>
      )}

      {completionType && (
        <CompletionModal
          type={completionType}
          stats={stats}
          onContinue={handleContinue}
          onBackToBook={() => router.push(`/book/${book.id}`)}
        />
      )}
    </div>
  );
}
