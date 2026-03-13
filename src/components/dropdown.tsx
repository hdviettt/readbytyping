"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, close]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-2 text-sm bg-surface/50 border rounded-full transition-all cursor-pointer ${
          open
            ? "border-border-hover bg-surface/80 text-foreground"
            : "border-border/50 text-muted hover:border-border-hover hover:text-foreground"
        }`}
      >
        <span>{selected?.label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 min-w-[180px] py-1.5 bg-surface border border-border/70 rounded-xl shadow-lg shadow-black/20 z-50 animate-dropdown-in">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? "text-foreground bg-border/30"
                    : "text-muted hover:text-foreground hover:bg-border/15"
                }`}
              >
                <span className="flex items-center gap-2">
                  {/* Active indicator */}
                  <span
                    className={`w-1 h-1 rounded-full flex-shrink-0 transition-opacity ${
                      isActive ? "bg-foreground opacity-100" : "opacity-0"
                    }`}
                  />
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
