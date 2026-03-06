import { createClient } from "@/lib/supabase";
import type { Book, ReadingProgress, Chapter, Page } from "@/types/book";
import type { SessionRecord, KeystrokeStat, WpmSample } from "@/types/typing";

const supabase = createClient();

// ── Helpers ──────────────────────────────────────────────

function dbBookToApp(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    fileType: row.file_type,
    totalChapters: row.total_chapters,
    totalPages: row.total_pages,
    totalCharacters: row.total_characters,
    chapters: row.chapters as Chapter[],
    createdAt: new Date(row.created_at).getTime(),
  };
}

function dbProgressToApp(row: any): ReadingProgress {
  return {
    bookId: row.book_id,
    chapterIndex: row.chapter_index,
    pageIndex: row.page_index,
    charOffset: row.char_offset,
    completedPages: row.completed_pages,
    lastTypedAt: row.last_typed_at ? new Date(row.last_typed_at).getTime() : null,
  };
}

function dbSessionToApp(row: any): SessionRecord {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    chapterIndex: row.chapter_index ?? undefined,
    pageIndex: row.page_index ?? undefined,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: new Date(row.ended_at).getTime(),
    durationSeconds: row.duration_seconds,
    totalCharactersTyped: row.total_characters_typed,
    correctCharacters: row.correct_characters,
    incorrectCharacters: row.incorrect_characters,
    avgWpm: row.avg_wpm,
    peakWpm: row.peak_wpm,
    accuracy: row.accuracy,
    wpmSamples: row.wpm_samples as WpmSample[],
  };
}

// ── Books ────────────────────────────────────────────────

export async function getBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("getBooks:", error); return []; }
  return (data || []).map(dbBookToApp);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (error) { console.error("getBook:", error); return undefined; }
  return data ? dbBookToApp(data) : undefined;
}

export async function saveBook(book: Book): Promise<void> {
  const { error } = await supabase.from("books").upsert({
    id: book.id,
    title: book.title,
    author: book.author,
    file_type: book.fileType,
    total_chapters: book.totalChapters,
    total_pages: book.totalPages,
    total_characters: book.totalCharacters,
    chapters: book.chapters,
    created_at: new Date(book.createdAt).toISOString(),
  });
  if (error) console.error("saveBook:", error);
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) console.error("deleteBook:", error);
}

// ── Reading Progress ─────────────────────────────────────

export async function getProgress(bookId: string): Promise<ReadingProgress | null> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("book_id", bookId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("getProgress:", error);
  }
  return data ? dbProgressToApp(data) : null;
}

export async function getAllProgress(): Promise<Record<string, ReadingProgress>> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*");

  if (error) { console.error("getAllProgress:", error); return {}; }
  const map: Record<string, ReadingProgress> = {};
  for (const row of data || []) {
    const p = dbProgressToApp(row);
    map[p.bookId] = p;
  }
  return map;
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  const { error } = await supabase.from("reading_progress").upsert({
    book_id: progress.bookId,
    chapter_index: progress.chapterIndex,
    page_index: progress.pageIndex,
    char_offset: progress.charOffset,
    completed_pages: progress.completedPages,
    last_typed_at: progress.lastTypedAt
      ? new Date(progress.lastTypedAt).toISOString()
      : null,
  });
  if (error) console.error("saveProgress:", error);
}

// ── Sessions ─────────────────────────────────────────────

export async function getSessions(): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from("typing_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) { console.error("getSessions:", error); return []; }
  return (data || []).map(dbSessionToApp);
}

export async function saveSession(session: SessionRecord): Promise<void> {
  const { error } = await supabase.from("typing_sessions").insert({
    id: session.id,
    book_id: session.bookId,
    book_title: session.bookTitle,
    chapter_index: session.chapterIndex ?? null,
    page_index: session.pageIndex ?? null,
    started_at: new Date(session.startedAt).toISOString(),
    ended_at: new Date(session.endedAt).toISOString(),
    duration_seconds: session.durationSeconds,
    total_characters_typed: session.totalCharactersTyped,
    correct_characters: session.correctCharacters,
    incorrect_characters: session.incorrectCharacters,
    avg_wpm: session.avgWpm,
    peak_wpm: session.peakWpm,
    accuracy: session.accuracy,
    wpm_samples: session.wpmSamples,
  });
  if (error) console.error("saveSession:", error);
}

// ── Keystroke Stats ──────────────────────────────────────

export async function getKeystrokeStats(): Promise<KeystrokeStat[]> {
  const { data, error } = await supabase
    .from("keystroke_stats")
    .select("*");

  if (error) { console.error("getKeystrokeStats:", error); return []; }
  return (data || []).map((row: any) => ({
    character: row.character,
    totalAttempts: row.total_attempts,
    correctAttempts: row.correct_attempts,
    incorrectAttempts: row.incorrect_attempts,
  }));
}

export async function updateKeystrokeStats(
  newStats: Map<string, { correct: number; incorrect: number }>
): Promise<void> {
  // Fetch existing, merge, upsert
  const existing = await getKeystrokeStats();
  const map = new Map(existing.map((s) => [s.character, s]));

  const rows: any[] = [];
  for (const [char, counts] of newStats) {
    const prev = map.get(char);
    rows.push({
      character: char,
      total_attempts: (prev?.totalAttempts ?? 0) + counts.correct + counts.incorrect,
      correct_attempts: (prev?.correctAttempts ?? 0) + counts.correct,
      incorrect_attempts: (prev?.incorrectAttempts ?? 0) + counts.incorrect,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("keystroke_stats").upsert(rows);
    if (error) console.error("updateKeystrokeStats:", error);
  }
}
