"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@/types/book";
import { useStore } from "@/hooks/use-store";
import * as db from "@/lib/supabase-store";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import {
  calculateSessionWpm,
  calculateAccuracy,
  generateWpmSamples,
} from "@/lib/typing/wpm";
import { TypingDisplay } from "./typing-display";
import { TypingStatsBar } from "./typing-stats-bar";
import { ChapterNav } from "./chapter-nav";
import { CompletionModal } from "./completion-modal";
import { StreakEffects } from "./streak-effects";
import { TypewriterKeyboard } from "./typewriter-keyboard";
import { playKeystroke, playReturn, playBackspace, playError, cleanupAudio } from "@/lib/typing/sounds";
import { useSettings } from "@/hooks/use-settings";

export function TypingInterface({
  book,
  startChapterIndex,
}: {
  book: Book;
  startChapterIndex: number;
}) {
  const router = useRouter();
  const { settings } = useSettings();
  const { progress: allProgress, refreshProgress, refreshSessions, refreshKeystrokeStats } = useStore();

  const progress = allProgress[book.id] ?? null;

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
    keystrokesRef,
  } = useTypingEngine(page?.content || "", startOffset);

  const typingContainerRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef(state);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const showBeginPrompt = useRef(true);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Track last key action for keyboard flash
  const [lastAction, setLastAction] = useState<{
    key: string;
    correct: boolean;
    timestamp: number;
  } | null>(null);

  // Play typewriter sounds and track key actions
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (state.cursor === prev.cursor) return;

    // Reset pause timer on any keystroke
    setIsPaused(false);
    clearTimeout(pauseTimerRef.current);
    if (!state.isComplete && state.startedAt) {
      pauseTimerRef.current = setTimeout(() => setIsPaused(true), 10000);
    }

    if (state.cursor < prev.cursor) {
      if (settings.soundEnabled) playBackspace();
      setLastAction({ key: "Backspace", correct: true, timestamp: Date.now() });
    } else if (state.cursor > prev.cursor) {
      const typedChar = state.text[state.cursor - 1];
      const isError = state.errors.has(state.cursor - 1);

      if (settings.soundEnabled) {
        if (typedChar === "\n") {
          playReturn();
        } else if (isError) {
          playError();
        } else {
          playKeystroke();
        }
      }

      // Determine what was actually typed from the last keystroke
      const lastKs = state.keystrokes[state.keystrokes.length - 1];
      setLastAction({
        key: lastKs?.actual ?? typedChar,
        correct: !isError,
        timestamp: Date.now(),
      });
    }
  }, [state, settings.soundEnabled]);

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
    async (charOffset: number, completed: boolean = false) => {
      await db.saveProgress({
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => cleanupAudio();
  }, []);

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

    (async () => {
      await doSaveProgress(state.cursor, true);

      if (state.startedAt && state.lastKeystrokeAt) {
        const duration = state.lastKeystrokeAt - state.startedAt;
        const samples = generateWpmSamples(state);

        await db.saveSession({
          id: crypto.randomUUID(),
          bookId: book.id,
          bookTitle: book.title,
          chapterIndex,
          pageIndex,
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

        const charMap = new Map<
          string,
          { correct: number; incorrect: number }
        >();
        for (const k of keystrokesRef.current) {
          const prev = charMap.get(k.expected) || {
            correct: 0,
            incorrect: 0,
          };
          if (k.correct) prev.correct++;
          else prev.incorrect++;
          charMap.set(k.expected, prev);
        }
        await db.updateKeystrokeStats(charMap);

        peakWpmRef.current = 0;

        // Refresh store data
        await Promise.all([refreshProgress(), refreshSessions(), refreshKeystrokeStats()]);
      }
    })();

    // Determine completion type
    showBeginPrompt.current = false;
    const isLastPageInChapter = pageIndex === chapter.pages.length - 1;
    const isLastChapter = chapterIndex === book.chapters.length - 1;

    if (isLastPageInChapter && isLastChapter) {
      setCompletionType("book");
    } else if (isLastPageInChapter) {
      setCompletionType("chapter");
    } else {
      // Auto-advance to next page with brief transition
      setIsTransitioning(true);
      setTimeout(() => {
        setIsPaused(false);
        setPageIndex(p => p + 1);
        setIsTransitioning(false);
        focusInput();
      }, 600);
    }
  }, [state.isComplete]);

  const handleContinue = useCallback(() => {
    setCompletionType(null);
    setIsPaused(false);
    if (pageIndex < chapter.pages.length - 1) {
      setPageIndex(pageIndex + 1);
    } else if (chapterIndex < book.chapters.length - 1) {
      setChapterIndex(chapterIndex + 1);
      setPageIndex(0);
    }
    setTimeout(() => focusInput(), 50);
  }, [pageIndex, chapter?.pages.length, chapterIndex, book.chapters.length, focusInput]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      if (completionType === "chapter") {
        handleContinue();
        return;
      }
      if (isTransitioning || completionType) return;
      handleKeyDown(e);
    },
    [completionType, isTransitioning, handleKeyDown, handleContinue]
  );

  if (!page) return null;

  // Expected character for keyboard highlighting
  const expectedChar = state.isComplete ? null : state.text[state.cursor] ?? null;

  return (
    <div className="max-w-3xl mx-auto" onClick={focusInput}>
      {/* Chapter info */}
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

      {/* Stats bar */}
      <div className="mt-1.5">
        <TypingStatsBar stats={stats} progress={pageProgress} />
      </div>

      {/* Book page — the focal point */}
      <div className={`relative mt-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-20' : 'opacity-100'}`} ref={typingContainerRef}>
        <TypingDisplay
          text={page.content}
          getCharStatus={charStatuses}
          onClick={focusInput}
          cursor={state.cursor}
          fontSize={settings.fontSize}
        />
        {settings.streakEffects && (
          <StreakEffects
            streak={state.streak}
            containerRef={typingContainerRef}
            shakeEnabled={settings.screenShake}
          />
        )}
        {!state.startedAt && !state.isComplete && showBeginPrompt.current && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="stamp text-sm animate-pulse">
              Begin Typing
            </span>
          </div>
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-1000 ${isPaused ? "opacity-100" : "opacity-0"}`}
          style={{ background: isPaused ? "rgba(0,0,0,0.25)" : "transparent" }}
        >
          {isPaused && (
            <span className="stamp text-xl">Paused</span>
          )}
        </div>
        {completionType === "chapter" && (
          <div className="absolute inset-0 flex items-center justify-center z-30"
               style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="bg-surface border-2 border-border px-8 py-6 text-center max-w-xs">
              <span className="stamp text-sm animate-stamp">Cleared</span>
              <div className="flex gap-8 mt-4 mb-4 justify-center">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim">WPM</p>
                  <p className="text-xl font-bold font-typewriter text-accent">{stats.wpm}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim">Accuracy</p>
                  <p className="text-xl font-bold font-typewriter text-ink-correct">{stats.accuracy}%</p>
                </div>
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted animate-pulse mt-2">
                Press any key to continue
              </p>
            </div>
          </div>
        )}
        <textarea
          ref={inputRef}
          onKeyDown={onKeyDown}
          className="absolute top-0 left-0 w-0 h-0 opacity-0"
          autoFocus
          aria-label="Type here"
        />
      </div>

      {/* On-screen keyboard — standalone */}
      {settings.keyboardVisible && (
        <TypewriterKeyboard
          expectedChar={expectedChar}
          lastAction={lastAction}
        />
      )}

      {completionType === "book" && (
        <CompletionModal
          type="book"
          stats={stats}
          onContinue={handleContinue}
          onBackToBook={() => router.push(`/book/${book.id}`)}
        />
      )}
    </div>
  );
}
