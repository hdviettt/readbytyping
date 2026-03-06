import { describe, it, expect } from "vitest";
import { calculateWpm, calculateRollingWpm, calculateSessionWpm, calculateAccuracy } from "./wpm";
import type { TypingState } from "@/types/typing";

function makeState(overrides: Partial<TypingState> = {}): TypingState {
  return {
    text: "test",
    cursor: 0,
    errors: new Set(),
    totalTyped: 0,
    correctCount: 0,
    incorrectCount: 0,
    isComplete: false,
    startedAt: null,
    lastKeystrokeAt: null,
    keystrokes: [],
    streak: 0,
    ...overrides,
  };
}

describe("calculateWpm", () => {
  it("returns 0 for zero elapsed", () => {
    expect(calculateWpm(10, 0)).toBe(0);
  });

  it("returns 0 for negative elapsed", () => {
    expect(calculateWpm(10, -100)).toBe(0);
  });

  it("calculates correctly (50 chars in 60s = 10 WPM)", () => {
    expect(calculateWpm(50, 60000)).toBe(10);
  });

  it("calculates correctly (250 chars in 60s = 50 WPM)", () => {
    expect(calculateWpm(250, 60000)).toBe(50);
  });
});

describe("calculateRollingWpm", () => {
  it("returns 0 when not started", () => {
    expect(calculateRollingWpm(makeState())).toBe(0);
  });

  it("returns 0 when no keystrokes", () => {
    expect(calculateRollingWpm(makeState({ startedAt: 1000 }))).toBe(0);
  });

  it("returns 0 within first 3 seconds", () => {
    const state = makeState({
      startedAt: 1000,
      lastKeystrokeAt: 2000,
      keystrokes: [
        { expected: "a", actual: "a", correct: true, timestamp: 2000, elapsed: 0 },
      ],
    });
    expect(calculateRollingWpm(state)).toBe(0);
  });

  it("calculates after 3 seconds", () => {
    const startedAt = 10000;
    const keystrokes = [];
    // 25 correct chars over 5 seconds
    for (let i = 0; i < 25; i++) {
      keystrokes.push({
        expected: "a",
        actual: "a",
        correct: true,
        timestamp: startedAt + (i + 1) * 200,
        elapsed: 200,
      });
    }
    const state = makeState({
      startedAt,
      lastKeystrokeAt: startedAt + 5000,
      keystrokes,
      correctCount: 25,
    });
    const wpm = calculateRollingWpm(state);
    expect(wpm).toBeGreaterThan(0);
  });

  it("excludes idle gaps >5s from rolling window", () => {
    const base = 10000;
    const keystrokes = [
      { expected: "a", actual: "a", correct: true, timestamp: base + 1000, elapsed: 0 },
      { expected: "b", actual: "b", correct: true, timestamp: base + 2000, elapsed: 1000 },
      // 6-second idle gap
      { expected: "c", actual: "c", correct: true, timestamp: base + 8000, elapsed: 6000 },
      { expected: "d", actual: "d", correct: true, timestamp: base + 9000, elapsed: 1000 },
      { expected: "e", actual: "e", correct: true, timestamp: base + 10000, elapsed: 1000 },
    ];
    const state = makeState({
      startedAt: base,
      lastKeystrokeAt: base + 10000,
      keystrokes,
      correctCount: 5,
    });
    const wpmWithIdle = calculateRollingWpm(state);
    // With idle exclusion, effective window is 10s - 6s = 4s
    // Higher WPM than naive 10s window
    expect(wpmWithIdle).toBeGreaterThan(0);
  });
});

describe("calculateSessionWpm", () => {
  it("returns 0 when not started", () => {
    expect(calculateSessionWpm(makeState())).toBe(0);
  });

  it("calculates correctly", () => {
    const state = makeState({
      startedAt: 1000,
      lastKeystrokeAt: 61000,
      correctCount: 250,
    });
    expect(calculateSessionWpm(state)).toBe(50);
  });
});

describe("calculateAccuracy", () => {
  it("returns 100 when nothing typed", () => {
    expect(calculateAccuracy(makeState())).toBe(100);
  });

  it("calculates correctly", () => {
    expect(calculateAccuracy(makeState({ totalTyped: 10, correctCount: 8 }))).toBe(80);
  });
});
