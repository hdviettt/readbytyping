"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-typewriter font-bold text-lg text-accent tracking-wide">
          BookTyper
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-paper text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            Library
          </Link>
          <Link
            href="/stats"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/stats"
                ? "bg-paper text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  );
}
