"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "booktyper_onboarded";

export function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  return (
    <div className="mb-8 p-8 bg-surface/50 border border-border/50 text-center animate-fade-up">
      {/* Typewriter SVG */}
      <svg
        viewBox="0 0 120 100"
        className="w-20 h-20 mx-auto mb-4 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Body */}
        <rect x="15" y="40" width="90" height="40" rx="6" className="fill-paper stroke-border" />
        {/* Paper */}
        <rect x="35" y="10" width="50" height="40" rx="2" className="fill-paper-bg stroke-border" />
        {/* Paper lines */}
        <line x1="42" y1="22" x2="78" y2="22" className="stroke-dim" strokeWidth="1" />
        <line x1="42" y1="30" x2="78" y2="30" className="stroke-dim" strokeWidth="1" />
        <line x1="42" y1="38" x2="65" y2="38" className="stroke-dim" strokeWidth="1" />
        {/* Keys */}
        <rect x="25" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        <rect x="36" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        <rect x="47" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        <rect x="58" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        <rect x="69" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        <rect x="80" y="55" width="8" height="6" rx="1" className="fill-key-bg stroke-key-border" />
        {/* Spacebar */}
        <rect x="36" y="65" width="48" height="5" rx="1" className="fill-key-bg stroke-key-border" />
      </svg>

      <h2 className="text-lg font-serif font-semibold text-foreground mb-1">
        Welcome to BookTyper
      </h2>
      <p className="text-muted text-[13px] mb-1">
        Practice your typing with real books.
      </p>
      <p className="text-dim text-xs mb-5">
        Upload an EPUB or PDF above to get started.
      </p>

      {/* Arrow pointing up to upload area */}
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5 mx-auto text-accent animate-bounce"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>

      <button
        onClick={dismiss}
        className="mt-4 text-xs text-dim hover:text-muted transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
