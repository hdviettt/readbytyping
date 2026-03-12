"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThemeStore } from "@/store/theme-store";
import { ACCENT_COLORS, RADIUS_PRESETS, type RadiusKey } from "@/lib/theme-config";

interface ThemeConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeConfigurator({ isOpen, onClose }: ThemeConfiguratorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const store = useThemeStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const radiusKeys = Object.keys(RADIUS_PRESETS) as RadiusKey[];

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={`absolute right-0 top-0 h-full w-[300px] bg-surface border-l border-border overflow-y-auto transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6 p-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
            <button
              onClick={onClose}
              className="p-1 text-muted hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Mode */}
          <Section label="Mode">
            <div className="flex border border-border/70 overflow-hidden">
              <ModeButton active={store.mode === "light"} onClick={() => store.setMode("light")}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Light
              </ModeButton>
              <ModeButton active={store.mode === "dark"} onClick={() => store.setMode("dark")}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Dark
              </ModeButton>
            </div>
          </Section>

          {/* Accent Color */}
          <Section label="Accent">
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => store.setAccent(c.key)}
                  className={`group relative aspect-square border-2 transition-all ${
                    store.accentKey === c.key
                      ? "border-foreground scale-[1.08]"
                      : "border-transparent hover:scale-[1.05]"
                  }`}
                  style={{ background: c.accent }}
                  title={c.name}
                >
                  {store.accentKey === c.key && (
                    <span className="text-white text-xs font-bold drop-shadow-md">&#10003;</span>
                  )}
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-dim whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Corners */}
          <Section label="Corners">
            <div className="flex gap-1.5">
              {radiusKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => store.setRadius(key)}
                  className={`flex-1 py-1.5 text-[11px] font-medium border transition-colors ${
                    store.radiusKey === key
                      ? "bg-accent text-background border-accent"
                      : "bg-transparent text-muted border-border/70 hover:border-accent hover:text-accent"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </Section>

          {/* Reset */}
          <button
            onClick={store.reset}
            className="text-xs text-dim hover:text-muted transition-colors text-center py-2 mt-2"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-background font-semibold"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
