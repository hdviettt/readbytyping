"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { useStore } from "@/hooks/use-store";
import * as db from "@/lib/supabase-store";
import { parseEpub } from "@/lib/parsers/epub-parser";
import { parsePdf } from "@/lib/parsers/pdf-parser";
import type { Book, Chapter, Page } from "@/types/book";
import { Onboarding } from "@/components/onboarding";

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 25%, 35%)`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type SortOption = "recent" | "last-typed" | "title" | "progress";

export default function LibraryPage() {
  const { books, progress, loading, refreshBooks, removeBook } = useStore();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [undoItem, setUndoItem] = useState<{ book: Book; timeout: ReturnType<typeof setTimeout> } | null>(null);
  const [undoExiting, setUndoExiting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (ext !== ".epub" && ext !== ".pdf") {
        setError("Please upload an EPUB or PDF file");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const fileType = ext === ".epub" ? "epub" : "pdf";
        const parsed =
          fileType === "epub"
            ? await parseEpub(file)
            : await parsePdf(file);

        if (parsed.chapters.length === 0) {
          setError("No readable content found in file");
          setUploading(false);
          return;
        }

        let totalPages = 0;
        let totalCharacters = 0;
        const chapters: Chapter[] = parsed.chapters.map((ch, ci) => {
          const pages: Page[] = ch.pages.map((p, pi) => {
            totalPages++;
            totalCharacters += p.characterCount;
            return {
              id: `${ci}-${pi}`,
              content: p.content,
              wordCount: p.wordCount,
              characterCount: p.characterCount,
            };
          });
          return { id: `ch-${ci}`, title: ch.title, pages };
        });

        const book: Book = {
          id: crypto.randomUUID(),
          title: parsed.title || file.name.replace(/\.(epub|pdf)$/i, ""),
          author: parsed.author,
          fileType,
          totalChapters: chapters.length,
          totalPages,
          totalCharacters,
          chapters,
          createdAt: Date.now(),
        };

        await db.saveBook(book);
        await refreshBooks();
        setUploading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Make sure it's a valid EPUB or PDF.");
        setUploading(false);
      }
    },
    [refreshBooks]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId === id) {
      doDelete(id);
    } else {
      setConfirmDeleteId(id);
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  async function doDelete(id: string) {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    setConfirmDeleteId(null);
    clearTimeout(confirmTimerRef.current);

    removeBook(id);
    db.deleteBook(id);

    if (undoItem) {
      clearTimeout(undoItem.timeout);
      setUndoExiting(false);
    }

    const timeout = setTimeout(() => {
      setUndoExiting(true);
      setTimeout(() => setUndoItem(null), 300);
    }, 5000);

    setUndoItem({ book, timeout });
  }

  async function handleUndo() {
    if (!undoItem) return;
    clearTimeout(undoItem.timeout);
    db.saveBook(undoItem.book).then(() => refreshBooks());
    setUndoExiting(true);
    setTimeout(() => {
      setUndoItem(null);
      setUndoExiting(false);
    }, 300);
  }

  const filtered = books.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "recent":
        return b.createdAt - a.createdAt;
      case "last-typed": {
        const pa = progress[a.id]?.lastTypedAt ?? 0;
        const pb = progress[b.id]?.lastTypedAt ?? 0;
        return pb - pa;
      }
      case "title":
        return a.title.localeCompare(b.title);
      case "progress": {
        const pctA = a.totalPages > 0 ? (progress[a.id]?.completedPages ?? 0) / a.totalPages : 0;
        const pctB = b.totalPages > 0 ? (progress[b.id]?.completedPages ?? 0) / b.totalPages : 0;
        return pctB - pctA;
      }
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <>
        <Nav />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="py-12 space-y-3 max-w-lg mx-auto animate-pulse">
            <div className="h-3 bg-border/30 rounded-full w-3/4" />
            <div className="h-3 bg-border/30 rounded-full w-1/2" />
            <div className="h-3 bg-border/30 rounded-full w-2/3" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main
        className="max-w-5xl mx-auto px-6 py-10"
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {/* Header row: title + upload button inline */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold text-foreground">Library</h1>
            <span className="text-[13px] text-dim">{books.length} {books.length === 1 ? "book" : "books"}</span>
          </div>
          <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer rounded-full transition-all ${
            uploading ? "text-muted" : "bg-accent hover:bg-accent-hover text-background"
          }`}>
            {uploading ? (
              <span className="flex items-center gap-1">
                Processing<TypingDots />
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Book
              </>
            )}
            <input
              type="file"
              accept=".epub,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        </div>

        {/* Drag overlay */}
        {dragActive && (
          <div className="fixed inset-0 z-40 bg-accent/5 border-2 border-dashed border-accent/40 rounded-3xl m-4 flex items-center justify-center pointer-events-none">
            <p className="text-accent font-medium text-lg">Drop file to upload</p>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-ink-error/8 border border-ink-error/20 rounded-lg">
            <p className="text-sm text-ink-error">{error}</p>
          </div>
        )}

        {/* Search and sort */}
        {books.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-transparent border border-border/70 rounded-lg placeholder:text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm bg-transparent border border-border/70 rounded-lg focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            >
              <option value="recent">Recently added</option>
              <option value="last-typed">Recently typed</option>
              <option value="title">Title A–Z</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        )}

        {/* Book list */}
        {books.length === 0 ? (
          <Onboarding />
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <p className="text-muted text-sm mb-1">No books match your search.</p>
            <p className="text-dim text-xs">Try a different keyword or clear the filter.</p>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {sorted.map((book) => {
              const prog = progress[book.id];
              const pct =
                book.totalPages > 0
                  ? Math.round(
                      ((prog?.completedPages || 0) / book.totalPages) * 100
                    )
                  : 0;
              const isInProgress = pct > 0 && pct < 100;

              return (
                <div
                  key={book.id}
                  className="group flex rounded-xl border border-border/50 hover:border-accent/30 bg-surface/30 hover:bg-surface/60 transition-all"
                >
                  {/* Color spine */}
                  <div
                    className="w-1.5 shrink-0 rounded-l-xl"
                    style={{ background: pct === 100 ? "var(--ink-correct)" : hashColor(book.title) }}
                  />

                  {/* Content */}
                  <button
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="flex-1 min-w-0 flex items-center gap-4 px-4 py-3.5 text-left cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold truncate group-hover:text-accent transition-colors">
                          {book.title}
                        </h3>
                        {pct === 100 && (
                          <span className="badge badge-success shrink-0">Done</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {book.author && (
                          <span className="text-[13px] text-muted truncate">
                            {book.author}
                          </span>
                        )}
                        <span className="text-[11px] text-dim">{book.totalPages} pg</span>
                        <span className="text-[11px] text-dim">{book.totalChapters} ch</span>
                        {prog?.lastTypedAt && (
                          <span className="text-[11px] text-dim">{timeAgo(prog.lastTypedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar — right side */}
                    {isInProgress && (
                      <div className="w-24 shrink-0">
                        <div className="w-full h-1 bg-border/30 rounded-full">
                          <div className="h-full bg-accent/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[11px] text-dim text-right mt-0.5">{pct}%</p>
                      </div>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col items-end justify-center px-3 gap-1 border-l border-border/30">
                    {isInProgress && prog ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/book/${book.id}/type?chapter=${prog.chapterIndex}`);
                        }}
                        className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => handleDeleteClick(book.id)}
                      className={`text-[11px] transition-colors ${
                        confirmDeleteId === book.id
                          ? "text-ink-error font-medium"
                          : "text-dim hover:text-ink-error opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {confirmDeleteId === book.id ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {undoItem && (
        <div className={`fixed bottom-6 left-1/2 z-50 bg-surface border border-border/70 rounded-xl px-4 py-2.5 flex items-center gap-3 ${
          undoExiting ? "animate-toast-out" : "animate-toast-in"
        }`} style={{ willChange: "transform, opacity" }}>
          <p className="text-[13px] text-muted">
            Deleted <span className="text-foreground font-medium">{undoItem.book.title}</span>
          </p>
          <button
            onClick={handleUndo}
            className="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}

function TypingDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-4">{dots}</span>;
}
