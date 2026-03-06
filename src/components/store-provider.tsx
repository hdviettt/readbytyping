"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { StoreContext, type StoreData } from "@/hooks/use-store";
import * as db from "@/lib/supabase-store";
import type { Book, ReadingProgress } from "@/types/book";
import type { SessionRecord, KeystrokeStat } from "@/types/typing";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [keystrokeStats, setKeystrokeStats] = useState<KeystrokeStat[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const refreshBooks = useCallback(async () => {
    setBooks(await db.getBooks());
  }, []);

  const refreshProgress = useCallback(async () => {
    setProgress(await db.getAllProgress());
  }, []);

  const refreshSessions = useCallback(async () => {
    setSessions(await db.getSessions());
  }, []);

  const refreshKeystrokeStats = useCallback(async () => {
    setKeystrokeStats(await db.getKeystrokeStats());
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      refreshBooks(),
      refreshProgress(),
      refreshSessions(),
      refreshKeystrokeStats(),
    ]);
  }, [refreshBooks, refreshProgress, refreshSessions, refreshKeystrokeStats]);

  // Load all data once auth is ready
  useEffect(() => {
    if (authLoading || !user) return;
    setDataLoading(true);
    refresh().then(() => setDataLoading(false));
  }, [authLoading, user, refresh]);

  const loading = authLoading || dataLoading;

  const value: StoreData = {
    books,
    progress,
    sessions,
    keystrokeStats,
    loading,
    refresh,
    refreshBooks,
    refreshProgress,
    refreshSessions,
    refreshKeystrokeStats,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
