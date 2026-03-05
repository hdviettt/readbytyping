import type { TypingState, WpmSample } from "@/types/typing";

/**
 * Standard WPM: (correct characters / 5) / elapsed minutes
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((correctChars / 5) / minutes);
}

/**
 * Calculate rolling WPM over a recent time window
 */
export function calculateRollingWpm(
  state: TypingState,
  windowMs: number = 10000
): number {
  if (!state.startedAt || state.keystrokes.length === 0) return 0;

  const now = state.lastKeystrokeAt || Date.now();
  const windowStart = now - windowMs;

  const recentCorrect = state.keystrokes.filter(
    (k) => k.timestamp >= windowStart && k.correct
  ).length;

  const actualWindow = Math.min(windowMs, now - state.startedAt);
  return calculateWpm(recentCorrect, actualWindow);
}

/**
 * Calculate session-level WPM
 */
export function calculateSessionWpm(state: TypingState): number {
  if (!state.startedAt || !state.lastKeystrokeAt) return 0;
  const elapsed = state.lastKeystrokeAt - state.startedAt;
  return calculateWpm(state.correctCount, elapsed);
}

/**
 * Calculate accuracy as a percentage (0-100)
 */
export function calculateAccuracy(state: TypingState): number {
  if (state.totalTyped === 0) return 100;
  return Math.round((state.correctCount / state.totalTyped) * 100);
}

/**
 * Sample WPM at regular intervals from keystroke history
 */
export function generateWpmSamples(
  state: TypingState,
  intervalMs: number = 5000
): WpmSample[] {
  if (!state.startedAt || state.keystrokes.length === 0) return [];

  const samples: WpmSample[] = [];
  const endTime = state.lastKeystrokeAt || Date.now();
  const duration = endTime - state.startedAt;

  for (let t = intervalMs; t <= duration; t += intervalMs) {
    const sampleTime = state.startedAt + t;
    const correctUpToNow = state.keystrokes.filter(
      (k) => k.timestamp <= sampleTime && k.correct
    ).length;
    const wpm = calculateWpm(correctUpToNow, t);
    samples.push({ t: t / 1000, wpm });
  }

  return samples;
}
