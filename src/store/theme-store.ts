/**
 * Zustand store for BookTyper theme state.
 * Persists preferences to localStorage, applies CSS variables to :root.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ACCENT_COLORS,
  RADIUS_PRESETS,
  DARK_THEME,
  LIGHT_THEME,
  DEFAULT_THEME,
  type ThemeMode,
  type RadiusKey,
  type ThemeState,
} from "@/lib/theme-config";

interface ThemeStore extends ThemeState {
  setMode: (mode: ThemeMode) => void;
  setAccent: (key: string) => void;
  setRadius: (key: RadiusKey) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...DEFAULT_THEME,
      setMode: (mode) => set({ mode }),
      setAccent: (accentKey) => set({ accentKey }),
      setRadius: (radiusKey) => set({ radiusKey }),
      reset: () => set(DEFAULT_THEME),
    }),
    { name: "booktyper-theme" },
  ),
);

/**
 * Apply current theme state to document CSS custom properties.
 * Maps to BookTyper's existing variable names so all components work unchanged.
 */
export function applyTheme(state: ThemeState): void {
  const root = document.documentElement;
  const color = ACCENT_COLORS.find((c) => c.key === state.accentKey) ?? ACCENT_COLORS[0];
  const radius = RADIUS_PRESETS[state.radiusKey];
  const isDark = state.mode === "dark";
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  // Light/dark class for any CSS using .light selector
  root.classList.remove("light", "dark");
  root.classList.add(state.mode);

  // Background
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--paper", theme.paper);

  // Text
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--ink", theme.ink);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--dim", theme.dim);

  // Borders
  root.style.setProperty("--border-color", theme.borderColor);
  root.style.setProperty("--border-hover", theme.borderHover);

  // Accent (from selected color)
  root.style.setProperty("--accent", color.accent);
  root.style.setProperty("--accent-hover", color.hover);
  root.style.setProperty("--ink-current", color.accent);
  root.style.setProperty("--paper-margin", color.accent);
  root.style.setProperty(
    "--accent-subtle",
    `rgba(${color.subtle.join(",")}, ${isDark ? 0.15 : 0.12})`,
  );

  // Status colors
  root.style.setProperty("--ink-correct", theme.inkCorrect);
  root.style.setProperty("--ink-error", theme.inkError);
  root.style.setProperty("--stamp", theme.stamp);
  root.style.setProperty("--stamp-dim", theme.stampDim);

  // Paper page (literary reading surface)
  root.style.setProperty("--paper-bg", theme.paperBg);
  root.style.setProperty("--paper-text", theme.paperText);
  root.style.setProperty("--paper-upcoming", theme.paperUpcoming);
  root.style.setProperty("--paper-line", theme.paperLine);
  root.style.setProperty("--paper-shadow", theme.paperShadow);

  // Keyboard
  root.style.setProperty("--key-bg", theme.keyBg);
  root.style.setProperty("--key-border", theme.keyBorder);
  root.style.setProperty("--key-text", theme.keyText);
  root.style.setProperty("--key-shadow", theme.keyShadow);

  // Platen
  root.style.setProperty("--platen-from", theme.platenFrom);
  root.style.setProperty("--platen-mid", theme.platenMid);

  // Radius
  root.style.setProperty("--r-xs", `${radius.xs}px`);
  root.style.setProperty("--r-sm", `${radius.sm}px`);
  root.style.setProperty("--r-md", `${radius.md}px`);
  root.style.setProperty("--r-lg", `${radius.lg}px`);
  root.style.setProperty("--r-btn", `${radius.btn}px`);
  root.style.setProperty("--r-badge", `${radius.badge}px`);

  // Data attribute
  root.dataset.theme = state.mode;
}
