"use client";

import { useReducer, useCallback, useEffect, useRef, useMemo } from "react";
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
  const keystrokesRef = useRef<import("@/types/typing").Keystroke[]>([]);

  // Keep keystrokesRef in sync — engine still adds to state.keystrokes for WPM,
  // but we also keep a ref copy for session-end reads without reducer cost
  const prevKeystrokeLenRef = useRef(0);
  if (state.keystrokes.length > prevKeystrokeLenRef.current) {
    for (let i = prevKeystrokeLenRef.current; i < state.keystrokes.length; i++) {
      keystrokesRef.current.push(state.keystrokes[i]);
    }
    prevKeystrokeLenRef.current = state.keystrokes.length;
  } else if (state.keystrokes.length === 0 && prevKeystrokeLenRef.current > 0) {
    // Reset happened
    keystrokesRef.current = [];
    prevKeystrokeLenRef.current = 0;
  }

  const stats = useMemo(() => computeStats(state), [state]);

  // Reset when text changes (new page). startOffset is intentionally not a dep —
  // it's read at reset time but should not trigger resets on its own (e.g. after
  // a background progress save updates the store).
  useEffect(() => {
    dispatch({ type: "RESET", text, startOffset });
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const charStatuses = useCallback(
    (index: number) => getCharStatus(state, index),
    [state]
  );

  const progress = getPageProgress(state);

  return {
    state,
    stats,
    charStatuses,
    progress,
    handleKeyDown,
    inputRef,
    focusInput,
    keystrokesRef,
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

