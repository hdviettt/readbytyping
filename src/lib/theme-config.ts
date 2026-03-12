/**
 * Theme configuration constants adapted for BookTyper.
 * Based on SEONGON shared-theme, mapped to BookTyper's CSS variable scheme.
 */

export interface AccentColor {
  name: string;
  key: string;
  accent: string;
  hover: string;
  subtle: [number, number, number];
  onLight: string;
  onDark: string;
}

export interface RadiusPreset {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  btn: number;
  badge: number;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: "Gold", key: "gold", accent: "#d4a63c", hover: "#e4b84a", subtle: [212, 166, 60], onLight: "#fff", onDark: "#1a1a1a" },
  { name: "Violet", key: "violet", accent: "#6e47ff", hover: "#5835e0", subtle: [110, 71, 255], onLight: "#fff", onDark: "#fff" },
  { name: "Blue", key: "blue", accent: "#3B82F6", hover: "#2563EB", subtle: [59, 130, 246], onLight: "#fff", onDark: "#000" },
  { name: "Teal", key: "teal", accent: "#14B8A6", hover: "#0D9488", subtle: [20, 184, 166], onLight: "#fff", onDark: "#000" },
  { name: "Emerald", key: "emerald", accent: "#10B981", hover: "#059669", subtle: [16, 185, 129], onLight: "#fff", onDark: "#000" },
  { name: "Rose", key: "rose", accent: "#F43F5E", hover: "#E11D48", subtle: [244, 63, 94], onLight: "#fff", onDark: "#fff" },
  { name: "Purple", key: "purple", accent: "#A855F7", hover: "#9333EA", subtle: [168, 85, 247], onLight: "#fff", onDark: "#fff" },
  { name: "Cyan", key: "cyan", accent: "#06B6D4", hover: "#0891B2", subtle: [6, 182, 212], onLight: "#fff", onDark: "#000" },
];

export const RADIUS_PRESETS: Record<string, RadiusPreset> = {
  none: { xs: 0, sm: 0, md: 0, lg: 0, btn: 0, badge: 0 },
  small: { xs: 2, sm: 4, md: 6, lg: 8, btn: 4, badge: 4 },
  medium: { xs: 6, sm: 8, md: 10, lg: 14, btn: 8, badge: 20 },
  large: { xs: 10, sm: 12, md: 16, lg: 20, btn: 12, badge: 24 },
};

/** BookTyper dark theme — zinc-based with warm literary accents */
export const DARK_THEME = {
  background: "#09090b",
  foreground: "#e4e4e7",
  surface: "#18181b",
  paper: "#1c1c21",
  borderColor: "#27272a",
  borderHover: "#3f3f46",
  muted: "#71717a",
  dim: "#52525b",
  ink: "#e4e4e7",
  inkCorrect: "#4ade80",
  inkError: "#f87171",
  stamp: "#ef4444",
  stampDim: "#991b1b",
  paperBg: "#f7f3e8",
  paperText: "#1c1917",
  paperUpcoming: "#a8a29e",
  paperLine: "#e7e5e4",
  paperShadow: "rgba(0, 0, 0, 0.4)",
  keyBg: "#18181b",
  keyBorder: "#27272a",
  keyText: "#a1a1aa",
  keyShadow: "#09090b",
  platenFrom: "#09090b",
  platenMid: "#27272a",
};

/** BookTyper light theme — warm stone palette */
export const LIGHT_THEME = {
  background: "#fafaf9",
  foreground: "#1c1917",
  surface: "#f5f5f4",
  paper: "#e7e5e4",
  borderColor: "#d6d3d1",
  borderHover: "#a8a29e",
  muted: "#78716c",
  dim: "#a8a29e",
  ink: "#1c1917",
  inkCorrect: "#16a34a",
  inkError: "#dc2626",
  stamp: "#dc2626",
  stampDim: "#fca5a5",
  paperBg: "#faf8f2",
  paperText: "#1c1917",
  paperUpcoming: "#a8a29e",
  paperLine: "#e7e5e4",
  paperShadow: "rgba(0, 0, 0, 0.08)",
  keyBg: "#f5f5f4",
  keyBorder: "#d6d3d1",
  keyText: "#57534e",
  keyShadow: "#d6d3d1",
  platenFrom: "#78716c",
  platenMid: "#a8a29e",
};

export type ThemeMode = "light" | "dark";
export type RadiusKey = keyof typeof RADIUS_PRESETS;

export interface ThemeState {
  mode: ThemeMode;
  accentKey: string;
  radiusKey: RadiusKey;
}

export const DEFAULT_THEME: ThemeState = {
  mode: "dark",
  accentKey: "gold",
  radiusKey: "none",
};
