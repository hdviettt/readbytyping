"use client";

export interface Settings {
  soundEnabled: boolean;
  keyboardVisible: boolean;
  streakEffects: boolean;
  screenShake: boolean;
  fontSize: number; // px
}

const DEFAULTS: Settings = {
  soundEnabled: true,
  keyboardVisible: true,
  streakEffects: true,
  screenShake: true,
  fontSize: 17,
};

const KEY = "booktyper_settings";

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function getDefaults(): Settings {
  return { ...DEFAULTS };
}
