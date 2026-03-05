export interface Book {
  id: string;
  title: string;
  author: string | null;
  fileType: "epub" | "pdf";
  totalChapters: number;
  totalPages: number;
  totalCharacters: number;
  chapters: Chapter[];
  createdAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  pages: Page[];
}

export interface Page {
  id: string;
  content: string;
  wordCount: number;
  characterCount: number;
}

export interface ReadingProgress {
  bookId: string;
  chapterIndex: number;
  pageIndex: number;
  charOffset: number;
  completedPages: number;
  lastTypedAt: number | null;
}
