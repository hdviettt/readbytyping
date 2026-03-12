"use client";

import { createContext, useContext } from "react";
import type { Book, ReadingProgress } from "@/types/book";
import type { SessionRecord, KeystrokeStat } from "@/types/typing";

export interface StoreData {
  books: Book[];
  progress: Record<string, ReadingProgress>;
  sessions: SessionRecord[];
  keystrokeStats: KeystrokeStat[];
  loading: boolean;
  refresh: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshKeystrokeStats: () => Promise<void>;
  removeBook: (id: string) => void;
}

export const StoreContext = createContext<StoreData>({
  books: [],
  progress: {},
  sessions: [],
  keystrokeStats: [],
  loading: true,
  refresh: async () => {},
  refreshBooks: async () => {},
  refreshProgress: async () => {},
  refreshSessions: async () => {},
  refreshKeystrokeStats: async () => {},
  removeBook: () => {},
});

export function useStore() {
  return useContext(StoreContext);
}
