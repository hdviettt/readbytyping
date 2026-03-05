"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import type { TypingState, TypingStats } from "@/types/typing";
import {
  createInitialState,
  handleKeyPress,
  getCharStatus,
  getPageProgress,
  shouldIgnoreKey,
} from "@/lib/typing/engine";
import {
  calculateRollingWpm,
  calculateSessionWpm,
  calculateAccuracy,
} from "@/lib/typing/wpm";

type Action =
  | { type: "KEY_PRESS"; key: string; timestamp: number }
  | { type: "RESET"; text: string; startOffset?: number };

function reducer(state: TypingState, action: Action): TypingState {
  switch (action.type) {
    case "KEY_PRESS":
      return handleKeyPress(state, action.key, action.timestamp);
    case "RESET":
      return createInitialState(action.text, action.startOffset);
    default:
      return state;
  }
}

export function useTypingEngine(text: string, startOffset: number = 0) {
  const [state, dispatch] = useReducer(
    reducer,
    { text, startOffset },
    ({ text, startOffset }) => createInitialState(text, startOffset)
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [stats, setStats] = useReducerStats(state);

  // Reset when text changes
  useEffect(() => {
    dispatch({ type: "RESET", text, startOffset });
  }, [text, startOffset]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent default for all keys to stop textarea behavior
      e.preventDefault();

      if (shouldIgnoreKey(e.key)) return;

      dispatch({
        type: "KEY_PRESS",
        key: e.key,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Focus input on mount and when needed
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Update stats periodically
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      setStats(computeStats(state));
    }, 500);
    return () => clearInterval(statsIntervalRef.current);
  }, [state]);

  const charStatuses = useCallback(
    (index: number) => getCharStatus(state, index),
    [state]
  );

  const progress = getPageProgress(state);

  return {
    state,
    stats: computeStats(state),
    charStatuses,
    progress,
    handleKeyDown,
    inputRef,
    focusInput,
    reset: (newText: string, offset?: number) =>
      dispatch({ type: "RESET", text: newText, startOffset: offset }),
  };
}

function computeStats(state: TypingState): TypingStats {
  const elapsedMs =
    state.startedAt && state.lastKeystrokeAt
      ? state.lastKeystrokeAt - state.startedAt
      : 0;

  return {
    wpm: calculateRollingWpm(state),
    accuracy: calculateAccuracy(state),
    correctChars: state.correctCount,
    incorrectChars: state.incorrectCount,
    totalChars: state.totalTyped,
    elapsedSeconds: Math.round(elapsedMs / 1000),
  };
}

// Simple state for stats updates
function useReducerStats(state: TypingState): [TypingStats, (s: TypingStats) => void] {
  const [stats, setStats] = useReducer(
    (_: TypingStats, next: TypingStats) => next,
    state,
    (s) => computeStats(s)
  );
  return [stats, setStats];
}
