"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { getBooks, saveBook, deleteBook, getProgress } from "@/lib/store";
import { parseEpub } from "@/lib/parsers/epub-parser";
import { parsePdf } from "@/lib/parsers/pdf-parser";
import type { Book, Chapter, Page } from "@/types/book";

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setBooks(getBooks());
  }, []);

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

        saveBook(book);
        setBooks(getBooks());
        setUploading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Make sure it's a valid EPUB or PDF.");
        setUploading(false);
      }
    },
    []
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDelete(id: string) {
    deleteBook(id);
    setBooks(getBooks());
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
            <p className="text-muted">Parsing book...</p>
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

        {/* Book list */}
        {books.length === 0 ? (
          <p className="text-center text-muted py-12">
            No books yet. Import one to start typing.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => {
              const progress = getProgress(book.id);
              const pct =
                book.totalPages > 0
                  ? Math.round(
                      ((progress?.completedPages || 0) / book.totalPages) * 100
                    )
                  : 0;

              return (
                <div
                  key={book.id}
                  className="border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors group"
                >
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
    </>
  );
}
