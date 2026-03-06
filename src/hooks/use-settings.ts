"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { type Settings, getSettings, saveSettings } from "@/lib/settings";

let listeners: Array<() => void> = [];
let cachedSettings: Settings | null = null;

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Settings {
  if (!cachedSettings) cachedSettings = getSettings();
  return cachedSettings;
}

function getServerSnapshot(): Settings {
  return getSettings();
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((partial: Partial<Settings>) => {
    const next = { ...getSnapshot(), ...partial };
    saveSettings(next);
    cachedSettings = next;
    listeners.forEach((l) => l());
  }, []);

  return { settings, update };
}
