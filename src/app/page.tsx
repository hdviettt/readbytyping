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
      // Second click — actually delete
      doDelete(id);
    } else {
      // First click — show confirm
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
        <main className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-center text-muted py-12 animate-pulse font-typewriter">Loading library...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-sm font-bold tracking-[0.25em] uppercase text-accent">File Cabinet</h1>
            <p className="text-[10px] text-dim tracking-wider uppercase mt-0.5">Document Archive</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-3 py-2 border-2 border-stamp/40 bg-stamp/10">
            <p className="text-xs text-stamp font-bold uppercase tracking-wider">{error}</p>
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
          className={`border-2 border-dashed p-6 text-center transition-colors mb-6 ${
            dragActive
              ? "border-accent bg-accent/10"
              : "border-border hover:border-border-hover"
          }`}
        >
          {uploading ? (
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-muted">
              Processing document<TypingDots />
            </span>
          ) : (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">
                Drop file here or{" "}
                <label className="text-accent hover:text-accent-hover cursor-pointer font-bold">
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
              <p className="text-[10px] text-dim tracking-wider">ACCEPTED: EPUB, PDF</p>
            </div>
          )}
        </div>

        {/* Search and sort */}
        {books.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-background border-2 border-border placeholder:text-dim focus:outline-none focus:border-accent font-typewriter uppercase tracking-wider"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs bg-background border-2 border-border focus:outline-none focus:border-accent font-typewriter uppercase tracking-wider"
            >
              <option value="recent">Recently added</option>
              <option value="last-typed">Recently typed</option>
              <option value="title">Title A-Z</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        )}

        {/* Book list */}
        {books.length === 0 ? (
          <Onboarding />
        ) : sorted.length === 0 ? (
          <p className="text-center text-muted py-12">
            No books match your search.
          </p>
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

              return (
                <div
                  key={book.id}
                  className="border-2 border-border hover:border-border-hover transition-colors group bg-surface"
                >
                  {/* File tab */}
                  <div className="flex items-center justify-between px-4 py-1.5 border-b-2 border-border bg-paper/30">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-dim">
                      {book.fileType} — {book.totalChapters} ch
                    </span>
                    {pct === 100 && (
                      <span className="stamp text-[8px] py-0 px-1.5 border-[1.5px]" style={{ transform: "rotate(-2deg)" }}>
                        Complete
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="w-full text-left px-4 py-3 cursor-pointer"
                  >
                    <h3 className="text-sm font-bold truncate group-hover:text-accent transition-colors uppercase tracking-wide">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-[11px] text-muted mt-0.5 truncate tracking-wider">
                        {book.author}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-dim tracking-wider uppercase">
                      <span>{book.totalPages} pages</span>
                      {prog?.lastTypedAt && (
                        <span>{timeAgo(prog.lastTypedAt)}</span>
                      )}
                    </div>
                    {isInProgress && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-background border border-border">
                          <div
                            className="h-full bg-accent transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5 tracking-wider">{pct}%</p>
                      </div>
                    )}
                  </button>
                  <div className="px-4 pb-2 flex items-center justify-between border-t border-border/50">
                    {isInProgress && prog ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/book/${book.id}/type?chapter=${prog.chapterIndex}`);
                        }}
                        className="text-[10px] text-accent hover:text-accent-hover uppercase tracking-wider font-bold transition-colors py-1"
                      >
                        Continue
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => handleDeleteClick(book.id)}
                      className={`text-[10px] uppercase tracking-wider font-bold transition-colors py-1 ${
                        confirmDeleteId === book.id
                          ? "text-stamp font-extrabold"
                          : "text-dim hover:text-stamp"
                      }`}
                    >
                      {confirmDeleteId === book.id ? "Confirm?" : "Discard"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {undoItem && (
        <div className={`fixed bottom-6 left-1/2 z-50 bg-surface border-2 border-border px-5 py-3 flex items-center gap-4 ${
          undoExiting ? "animate-toast-out" : "animate-toast-in"
        }`} style={{ willChange: "transform, opacity" }}>
          <p className="text-xs uppercase tracking-wider">
            Discarded: <span className="font-bold text-foreground">{undoItem.book.title}</span>
          </p>
          <button
            onClick={handleUndo}
            className="text-xs font-bold text-accent hover:text-accent-hover uppercase tracking-wider transition-colors"
          >
            Restore
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
