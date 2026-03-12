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

function hashGradient(str: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return [
    `hsl(${hue}, 20%, 22%)`,
    `hsl(${(hue + 40) % 360}, 15%, 13%)`,
  ];
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
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

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/30 overflow-hidden animate-pulse">
                <div className="h-32 bg-surface/50" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-border/20 rounded-full w-3/4" />
                  <div className="h-2.5 bg-border/20 rounded-full w-1/2" />
                </div>
              </div>
            ))}
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
        {/* Header */}
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
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface/50 border border-border/50 rounded-full placeholder:text-dim focus:outline-none focus:border-border-hover focus:bg-surface transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 text-sm bg-surface/50 border border-border/50 rounded-full focus:outline-none focus:border-border-hover transition-all"
            >
              <option value="recent">Recently added</option>
              <option value="last-typed">Recently typed</option>
              <option value="title">Title A–Z</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        )}

        {/* Book grid */}
        {books.length === 0 ? (
          <Onboarding />
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <p className="text-muted text-sm mb-1">No books match your search.</p>
            <p className="text-dim text-xs">Try a different keyword or clear the filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {sorted.map((book) => {
              const prog = progress[book.id];
              const pct =
                book.totalPages > 0
                  ? Math.round(
                      ((prog?.completedPages || 0) / book.totalPages) * 100
                    )
                  : 0;
              const isInProgress = pct > 0 && pct < 100;
              const isDone = pct === 100;
              const [c1, c2] = hashGradient(book.title);
              const initials = getInitials(book.title);

              return (
                <div
                  key={book.id}
                  className="group rounded-xl border border-border/50 bg-surface/20 hover:border-border-hover hover:bg-surface/40 overflow-hidden transition-all cursor-pointer"
                  onClick={() => router.push(`/book/${book.id}`)}
                >
                  {/* Cover */}
                  <div
                    className="h-32 flex items-center justify-center relative"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    <span className="text-3xl font-bold text-white/70 select-none tracking-wider">
                      {initials}
                    </span>

                    {isDone && (
                      <span className="badge badge-success absolute top-2.5 right-2.5">
                        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </span>
                    )}

                    {/* Delete button — top-right on hover */}
                    <button
                      onClick={(e) => handleDeleteClick(e, book.id)}
                      className={`absolute top-2.5 transition-all ${
                        isDone ? "left-2.5" : "right-2.5"
                      } ${
                        confirmDeleteId === book.id
                          ? "opacity-100 bg-ink-error/90 text-white px-2 py-0.5 rounded-full text-[11px] font-medium"
                          : "opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white text-xs"
                      }`}
                    >
                      {confirmDeleteId === book.id ? "Confirm?" : "×"}
                    </button>

                    {/* Continue overlay — appears on hover for in-progress books */}
                    {isInProgress && prog && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/book/${book.id}/type?chapter=${prog.chapterIndex}`);
                          }}
                          className="opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-accent text-background text-sm font-medium rounded-full transition-all hover:bg-accent-hover"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="text-[15px] font-medium text-foreground truncate">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-[13px] text-muted truncate mt-0.5">{book.author}</p>
                    )}

                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-dim">
                      <span>{book.totalChapters} ch</span>
                      <span className="text-border">·</span>
                      <span>{book.totalPages} pg</span>
                      {prog?.lastTypedAt && (
                        <>
                          <span className="text-border">·</span>
                          <span>{timeAgo(prog.lastTypedAt)}</span>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    {pct > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-1 bg-border/30 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDone ? "bg-ink-correct/60" : "bg-foreground/40"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-dim mt-1 text-right tabular-nums font-mono">{pct}%</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {undoItem && (
        <div className={`fixed bottom-6 left-1/2 z-50 bg-surface border border-border/70 rounded-full px-5 py-2.5 flex items-center gap-3 ${
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
