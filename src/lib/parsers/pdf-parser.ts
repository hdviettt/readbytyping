import { chunkText, type TextChunk } from "./text-chunker";

export interface ParsedChapter {
  title: string;
  pages: TextChunk[];
}

export interface ParsedBook {
  title: string;
  author: string | null;
  chapters: ParsedChapter[];
}

export async function parsePdf(file: File): Promise<ParsedBook> {
  const pdfjsLib = await import("pdfjs-dist");

  // Set up the worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;

  // Try to get metadata
  const metadata = await doc.getMetadata().catch(() => null);
  const info = metadata?.info as Record<string, string> | undefined;
  const title = info?.Title || file.name.replace(/\.pdf$/i, "");
  const author = info?.Author || null;

  // Extract text from all pages
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(text);
  }

  // Group into chapters
  const chapters: ParsedChapter[] = [];
  let currentText = "";
  let currentTitle = "Chapter 1";
  let chapterCount = 1;

  const chapterPattern = /^(chapter|part|section)\s+\d+/i;

  for (const pageText of pageTexts) {
    const trimmed = pageText.trim();
    if (!trimmed) continue;

    const firstLine = trimmed.split("\n")[0]?.trim() || "";

    if (chapterPattern.test(firstLine) && currentText.length > 200) {
      const pages = chunkText(currentText.trim());
      if (pages.length > 0) {
        chapters.push({ title: currentTitle, pages });
      }
      chapterCount++;
      currentTitle = firstLine || `Chapter ${chapterCount}`;
      currentText = trimmed;
    } else {
      currentText += "\n\n" + trimmed;
    }
  }

  // Save last chapter
  if (currentText.trim()) {
    const pages = chunkText(currentText.trim());
    if (pages.length > 0) {
      chapters.push({ title: currentTitle, pages });
    }
  }

  // Fallback: whole doc as one chapter
  if (chapters.length === 0) {
    const allText = pageTexts.join("\n\n").trim();
    if (allText) {
      const pages = chunkText(allText);
      if (pages.length > 0) {
        chapters.push({ title: "Full Text", pages });
      }
    }
  }

  return { title, author, chapters };
}
