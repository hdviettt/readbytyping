import type { Book, ReadingProgress } from "@/types/book";
import type { SessionRecord, KeystrokeStat } from "@/types/typing";

const KEYS = {
  books: "booktyper_books",
  progress: "booktyper_progress",
  sessions: "booktyper_sessions",
  keystrokeStats: "booktyper_keystroke_stats",
};

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Books
export function getBooks(): Book[] {
  return get<Book[]>(KEYS.books, []);
}

export function getBook(id: string): Book | undefined {
  return getBooks().find((b) => b.id === id);
}

export function saveBook(book: Book) {
  const books = getBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
  set(KEYS.books, books);
}

export function deleteBook(id: string) {
  set(KEYS.books, getBooks().filter((b) => b.id !== id));
  // Also delete progress
  const allProgress = get<Record<string, ReadingProgress>>(KEYS.progress, {});
  delete allProgress[id];
  set(KEYS.progress, allProgress);
}

// Reading Progress
export function getProgress(bookId: string): ReadingProgress | null {
  const all = get<Record<string, ReadingProgress>>(KEYS.progress, {});
  return all[bookId] || null;
}

export function saveProgress(progress: ReadingProgress) {
  const all = get<Record<string, ReadingProgress>>(KEYS.progress, {});
  all[progress.bookId] = progress;
  set(KEYS.progress, all);
}

// Sessions
export function getSessions(): SessionRecord[] {
  return get<SessionRecord[]>(KEYS.sessions, []);
}

export function getSessionsByBook(bookId: string): SessionRecord[] {
  return getSessions().filter((s) => s.bookId === bookId);
}

export function saveSession(session: SessionRecord) {
  const sessions = getSessions();
  sessions.unshift(session);
  // Keep last 200 sessions
  set(KEYS.sessions, sessions.slice(0, 200));
}

// Keystroke Stats
export function getKeystrokeStats(): KeystrokeStat[] {
  return get<KeystrokeStat[]>(KEYS.keystrokeStats, []);
}

export function updateKeystrokeStats(
  newStats: Map<string, { correct: number; incorrect: number }>
) {
  const existing = getKeystrokeStats();
  const map = new Map(existing.map((s) => [s.character, s]));

  for (const [char, counts] of newStats) {
    const prev = map.get(char);
    if (prev) {
      prev.totalAttempts += counts.correct + counts.incorrect;
      prev.correctAttempts += counts.correct;
      prev.incorrectAttempts += counts.incorrect;
    } else {
      map.set(char, {
        character: char,
        totalAttempts: counts.correct + counts.incorrect,
        correctAttempts: counts.correct,
        incorrectAttempts: counts.incorrect,
      });
    }
  }

  set(KEYS.keystrokeStats, Array.from(map.values()));
}
