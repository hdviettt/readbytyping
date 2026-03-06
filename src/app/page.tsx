"use client";

import { useState, useCallback, useEffect } from "react";
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

  async function handleDelete(id: string) {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    await db.deleteBook(id);
    await refreshBooks();

    if (undoItem) clearTimeout(undoItem.timeout);

    const timeout = setTimeout(() => {
      setUndoItem(null);
    }, 5000);

    setUndoItem({ book, timeout });
  }

  async function handleUndo() {
    if (!undoItem) return;
    clearTimeout(undoItem.timeout);
    await db.saveBook(undoItem.book);
    await refreshBooks();
    setUndoItem(null);
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold font-typewriter text-accent">Library</h1>
        </div>

        {error && (
          <div className="p-3 text-sm text-ink-error bg-ink-error/10 border border-ink-error/20 rounded-lg mb-6">
            {error}
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
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-8 ${
            dragActive
              ? "border-accent bg-accent/10"
              : "border-border hover:border-border-hover"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <span className="inline-block font-typewriter text-muted">
                Feeding paper into typewriter
                <TypingDots />
              </span>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-2">
                Drop an EPUB or PDF here, or{" "}
                <label className="text-accent hover:text-accent-hover cursor-pointer underline">
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
              <p className="text-xs text-dim">EPUB or PDF</p>
            </div>
          )}
        </div>

        {/* Search and sort */}
        {books.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg placeholder:text-dim focus:outline-none focus:border-accent"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
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

              return (
                <div
                  key={book.id}
                  className="border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors group"
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: hashColor(book.title) }}
                  />
                  <button
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="w-full text-left p-5 cursor-pointer"
                  >
                    <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-sm text-muted mt-0.5 truncate">
                        {book.author}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-dim">
                      <span>{book.totalChapters} ch</span>
                      <span>{book.totalPages} pages</span>
                      <span className="uppercase">{book.fileType}</span>
                    </div>
                    {prog?.lastTypedAt && (
                      <p className="text-xs text-dim mt-1">
                        Last typed {timeAgo(prog.lastTypedAt)}
                      </p>
                    )}
                    {pct > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted mt-1">{pct}%</p>
                      </div>
                    )}
                  </button>
                  <div className="px-5 pb-4 flex justify-end">
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-xs text-dim hover:text-ink-error transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {undoItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded-lg shadow-lg px-5 py-3 flex items-center gap-4">
          <p className="text-sm">
            Removed <span className="font-medium">{undoItem.book.title}</span>
          </p>
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
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
