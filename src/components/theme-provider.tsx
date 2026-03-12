"use client";

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "@/store/theme-store";
import { migrateFromLocalStorage } from "@/lib/db";

/**
 * Backward-compatible hook — returns { theme, toggle } like the old context-based provider.
 * Components needing full theme control can use useThemeStore directly.
 */
export function useTheme() {
  const store = useThemeStore();
  return {
    theme: store.mode,
    toggle: () => store.setMode(store.mode === "dark" ? "light" : "dark"),
  };
}

/**
 * Applies CSS custom properties from the Zustand theme store to the document root.
 * Migrates from the old localStorage key on first load.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const state = useThemeStore();

  // One-time migration from old theme storage + localStorage data
  useEffect(() => {
    const oldTheme = localStorage.getItem("booktyper_theme");
    if (oldTheme === "light" || oldTheme === "dark") {
      useThemeStore.getState().setMode(oldTheme);
      localStorage.removeItem("booktyper_theme");
    }
    migrateFromLocalStorage();
  }, []);

  // Apply CSS vars whenever theme state changes
  useEffect(() => {
    applyTheme(state);
  }, [state.mode, state.accentKey, state.radiusKey]);

  return <>{children}</>;
}
