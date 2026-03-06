import type { TypingState, CharStatus, Keystroke } from "@/types/typing";

export function createInitialState(text: string, startOffset: number = 0): TypingState {
  return {
    text,
    cursor: startOffset,
    errors: new Set(),
    totalTyped: 0,
    correctCount: 0,
    incorrectCount: 0,
    isComplete: false,
    startedAt: null,
    lastKeystrokeAt: null,
    keystrokes: [],
    streak: 0,
  };
}

const IGNORED_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Delete",
  "Tab",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
]);

export function shouldIgnoreKey(key: string): boolean {
  return IGNORED_KEYS.has(key);
}

export function handleKeyPress(
  state: TypingState,
  key: string,
  timestamp: number
): TypingState {
  if (state.isComplete) return state;
  if (shouldIgnoreKey(key)) return state;

  // Handle backspace
  if (key === "Backspace") {
    if (state.cursor <= 0) return state;

    const newCursor = state.cursor - 1;
    const newErrors = new Set(state.errors);
    const wasError = newErrors.has(newCursor);
    newErrors.delete(newCursor);

    return {
      ...state,
      cursor: newCursor,
      errors: newErrors,
      totalTyped: state.totalTyped > 0 ? state.totalTyped - 1 : 0,
      correctCount: wasError ? state.correctCount : Math.max(0, state.correctCount - 1),
      incorrectCount: wasError ? Math.max(0, state.incorrectCount - 1) : state.incorrectCount,
      lastKeystrokeAt: timestamp,
      streak: 0,
    };
  }

  const expected = state.text[state.cursor];
  if (expected === undefined) return state;

  // Map Enter key to newline
  const actual = key === "Enter" ? "\n" : key;

  // Only accept single characters
  if (actual.length !== 1 && actual !== "\n") return state;

  const isCorrect = actual === expected;
  const elapsed =
    state.lastKeystrokeAt !== null ? timestamp - state.lastKeystrokeAt : 0;

  const keystroke: Keystroke = {
    expected,
    actual,
    correct: isCorrect,
    timestamp,
    elapsed,
  };

  const newErrors = new Set(state.errors);
  if (!isCorrect) {
    newErrors.add(state.cursor);
  }

  const newCursor = state.cursor + 1;
  const isComplete = newCursor >= state.text.length;

  return {
    ...state,
    cursor: newCursor,
    errors: newErrors,
    totalTyped: state.totalTyped + 1,
    correctCount: state.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: state.incorrectCount + (isCorrect ? 0 : 1),
    isComplete,
    startedAt: state.startedAt ?? timestamp,
    lastKeystrokeAt: timestamp,
    keystrokes: [...state.keystrokes, keystroke],
    streak: isCorrect ? state.streak + 1 : 0,
  };
}

export function getCharStatus(
  state: TypingState,
  index: number
): CharStatus {
  if (index < state.cursor) {
    return state.errors.has(index) ? "incorrect" : "correct";
  }
  if (index === state.cursor) {
    return "current";
  }
  return "upcoming";
}

export function getPageProgress(state: TypingState) {
  return {
    current: state.cursor,
    total: state.text.length,
    percentage:
      state.text.length > 0
        ? Math.round((state.cursor / state.text.length) * 100)
        : 0,
  };
}
