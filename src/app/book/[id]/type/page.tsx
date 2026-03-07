"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/nav";
import { useStore } from "@/hooks/use-store";
import { TypingInterface } from "@/components/typing/typing-interface";
import { ErrorBoundary } from "@/components/error-boundary";

export default function TypingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { books, progress, loading } = useStore();

  if (loading) {
    return (
      <>
        <Nav />
        <main className="px-6 py-6">
          <p className="text-center text-muted py-12 animate-pulse font-mono">Loading...</p>
        </main>
      </>
    );
  }

  const book = books.find((b) => b.id === params.id);
  if (!book) {
    router.push("/");
    return null;
  }

  const ch = parseInt(searchParams.get("chapter") || "0", 10);
  const startChapter = Math.max(0, Math.min(ch, book.chapters.length - 1));

  return (
    <>
      <Nav />
      <main className="px-6 py-6">
        <ErrorBoundary>
          <TypingInterface book={book} startChapterIndex={startChapter} />
        </ErrorBoundary>
      </main>
    </>
  );
}
