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
  return `hsl(${hue}, 30%, 25%)`;
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
  const { books, progress, loading, refreshBooks } = useStore();
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

    await db.deleteBook(id);
    await refreshBooks();

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
    await db.saveBook(undoItem.book);
    await refreshBooks();
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
          <p className="text-center text-muted py-12 animate-pulse text-sm">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Library</h1>
            <p className="text-[13px] text-muted mt-0.5">{books.length} {books.length === 1 ? "book" : "books"}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-ink-error/8 border border-ink-error/20">
            <p className="text-sm text-ink-error">{error}</p>
          </div>
        )}

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border border-dashed p-8 text-center transition-all mb-8 ${
            dragActive
              ? "border-accent bg-accent/5"
              : "border-border/70 hover:border-border-hover"
          }`}
        >
          {uploading ? (
            <span className="text-sm text-muted">
              Processing<TypingDots />
            </span>
          ) : (
            <div>
              <p className="text-[13px] text-muted">
                Drop a file here or{" "}
                <label className="text-accent hover:text-accent-hover cursor-pointer font-medium">
                  browse
                  <input
                    type="file"
                    accept=".epub,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
              </p>
              <p className="text-xs text-dim mt-1">EPUB and PDF supported</p>
            </div>
          )}
        </div>

        {/* Search and sort */}
        {books.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-transparent border border-border/70 placeholder:text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm bg-transparent border border-border/70 focus:outline-none focus:border-accent/50 transition-all"
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
          <p className="text-center text-muted py-12 text-sm">
            No books match your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
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
                  className="group border border-border/50 hover:border-border-hover/70 bg-surface/50 hover:bg-surface transition-all"
                >
                  <button
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="w-full text-left px-4 pt-4 pb-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-serif font-semibold truncate group-hover:text-accent transition-colors leading-tight">
                        {book.title}
                      </h3>
                      {pct === 100 && (
                        <span className="badge badge-success shrink-0">Done</span>
                      )}
                    </div>
                    {book.author && (
                      <p className="text-[13px] text-muted mt-0.5 truncate">
                        {book.author}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-dim">
                      <span>{book.totalPages} pages</span>
                      <span className="text-border">·</span>
                      <span>{book.totalChapters} ch</span>
                      {prog?.lastTypedAt && (
                        <>
                          <span className="text-border">·</span>
                          <span>{timeAgo(prog.lastTypedAt)}</span>
                        </>
                      )}
                    </div>
                    {isInProgress && (
                      <div className="mt-3">
                        <div className="w-full h-1 bg-border/30">
                          <div
                            className="h-full bg-accent/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-dim mt-1">{pct}%</p>
                      </div>
                    )}
                  </button>
                  <div className="px-4 pb-3 flex items-center justify-between">
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
                      className={`text-xs transition-colors ${
                        confirmDeleteId === book.id
                          ? "text-ink-error font-medium"
                          : "text-dim hover:text-ink-error"
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
        <div className={`fixed bottom-6 left-1/2 z-50 bg-surface border border-border/70 px-4 py-2.5 flex items-center gap-3 ${
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
