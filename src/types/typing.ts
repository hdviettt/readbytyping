export type CharStatus = "correct" | "incorrect" | "current" | "upcoming";

export interface Keystroke {
  expected: string;
  actual: string;
  correct: boolean;
  timestamp: number;
  elapsed: number;
}

export interface TypingState {
  text: string;
  cursor: number;
  errors: Set<number>;
  totalTyped: number;
  correctCount: number;
  incorrectCount: number;
  isComplete: boolean;
  startedAt: number | null;
  lastKeystrokeAt: number | null;
  keystrokes: Keystroke[];
  streak: number;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  elapsedSeconds: number;
}

export interface WpmSample {
  t: number;
  wpm: number;
}

export interface SessionRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterIndex?: number;
  pageIndex?: number;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  totalCharactersTyped: number;
  correctCharacters: number;
  incorrectCharacters: number;
  avgWpm: number;
  peakWpm: number;
  accuracy: number;
  wpmSamples: WpmSample[];
}

export interface KeystrokeStat {
  character: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
}
