"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/nav";
import { getBook } from "@/lib/store";
import { TypingInterface } from "@/components/typing/typing-interface";
import type { Book } from "@/types/book";

export default function TypingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [startChapter, setStartChapter] = useState(0);

  useEffect(() => {
    const b = getBook(params.id as string);
    if (!b) {
      router.push("/");
      return;
    }
    setBook(b);

    const ch = parseInt(searchParams.get("chapter") || "0", 10);
    setStartChapter(Math.max(0, Math.min(ch, b.chapters.length - 1)));
  }, [params.id, searchParams, router]);

  if (!book) return null;

  return (
    <>
      <Nav />
      <main className="px-6 py-6">
        <TypingInterface book={book} startChapterIndex={startChapter} />
      </main>
    </>
  );
}
