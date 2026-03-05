"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          BookTyper
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Library
          </Link>
          <Link
            href="/stats"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/stats"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  );
}
