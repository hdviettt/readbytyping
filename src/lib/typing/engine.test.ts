import { describe, it, expect } from "vitest";
import {
  createInitialState,
  handleKeyPress,
  getCharStatus,
  getPageProgress,
  shouldIgnoreKey,
} from "./engine";

describe("createInitialState", () => {
  it("creates state with correct defaults", () => {
    const state = createInitialState("hello");
    expect(state.cursor).toBe(0);
    expect(state.text).toBe("hello");
    expect(state.isComplete).toBe(false);
    expect(state.streak).toBe(0);
    expect(state.totalTyped).toBe(0);
  });

  it("supports startOffset", () => {
    const state = createInitialState("hello", 3);
    expect(state.cursor).toBe(3);
  });
});

describe("shouldIgnoreKey", () => {
  it("ignores modifier keys", () => {
    expect(shouldIgnoreKey("Shift")).toBe(true);
    expect(shouldIgnoreKey("Control")).toBe(true);
    expect(shouldIgnoreKey("Alt")).toBe(true);
    expect(shouldIgnoreKey("Meta")).toBe(true);
  });

  it("does not ignore printable characters", () => {
    expect(shouldIgnoreKey("a")).toBe(false);
    expect(shouldIgnoreKey("1")).toBe(false);
    expect(shouldIgnoreKey(" ")).toBe(false);
  });
});

describe("handleKeyPress", () => {
  it("advances cursor on correct keystroke", () => {
    const state = createInitialState("abc");
    const next = handleKeyPress(state, "a", 1000);
    expect(next.cursor).toBe(1);
    expect(next.correctCount).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.startedAt).toBe(1000);
  });

  it("marks error on incorrect keystroke", () => {
    const state = createInitialState("abc");
    const next = handleKeyPress(state, "x", 1000);
    expect(next.cursor).toBe(1);
    expect(next.incorrectCount).toBe(1);
    expect(next.errors.has(0)).toBe(true);
    expect(next.streak).toBe(0);
  });

  it("completes on last character", () => {
    let state = createInitialState("ab");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "b", 1100);
    expect(state.isComplete).toBe(true);
    expect(state.cursor).toBe(2);
  });

  it("does nothing when already complete", () => {
    let state = createInitialState("a");
    state = handleKeyPress(state, "a", 1000);
    expect(state.isComplete).toBe(true);
    const next = handleKeyPress(state, "b", 1100);
    expect(next).toBe(state);
  });

  it("handles Enter as newline", () => {
    const state = createInitialState("a\nb");
    const s1 = handleKeyPress(state, "a", 1000);
    const s2 = handleKeyPress(s1, "Enter", 1100);
    expect(s2.cursor).toBe(2);
    expect(s2.correctCount).toBe(2);
  });

  it("builds streak on consecutive correct", () => {
    let state = createInitialState("abcde");
    for (let i = 0; i < 5; i++) {
      state = handleKeyPress(state, "abcde"[i], 1000 + i * 100);
    }
    expect(state.streak).toBe(5);
  });

  it("resets streak on incorrect", () => {
    let state = createInitialState("abc");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "a", 1100); // wrong
    expect(state.streak).toBe(0);
  });
});

describe("backspace", () => {
  it("moves cursor back", () => {
    let state = createInitialState("abc");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "Backspace", 1100);
    expect(state.cursor).toBe(0);
  });

  it("preserves streak on backspace (neutral)", () => {
    let state = createInitialState("abcde");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "b", 1100);
    state = handleKeyPress(state, "c", 1200);
    expect(state.streak).toBe(3);
    state = handleKeyPress(state, "Backspace", 1300);
    expect(state.streak).toBe(3);
  });

  it("does nothing at position 0", () => {
    const state = createInitialState("abc");
    const next = handleKeyPress(state, "Backspace", 1000);
    expect(next).toBe(state);
  });

  it("clears error when backspacing over it", () => {
    let state = createInitialState("abc");
    state = handleKeyPress(state, "x", 1000); // error at 0
    expect(state.errors.has(0)).toBe(true);
    state = handleKeyPress(state, "Backspace", 1100);
    expect(state.errors.has(0)).toBe(false);
  });
});

describe("getCharStatus", () => {
  it("returns correct statuses", () => {
    let state = createInitialState("abc");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "x", 1100); // error at 1

    expect(getCharStatus(state, 0)).toBe("correct");
    expect(getCharStatus(state, 1)).toBe("incorrect");
    expect(getCharStatus(state, 2)).toBe("current");
  });
});

describe("getPageProgress", () => {
  it("calculates percentage", () => {
    let state = createInitialState("abcd");
    state = handleKeyPress(state, "a", 1000);
    state = handleKeyPress(state, "b", 1100);
    const progress = getPageProgress(state);
    expect(progress.current).toBe(2);
    expect(progress.total).toBe(4);
    expect(progress.percentage).toBe(50);
  });
});
