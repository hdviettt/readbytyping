"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, isAnonymous, signOut } = useAuth();

  const email = user?.email;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

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
          <Link
            href="/settings"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-paper text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            Settings
          </Link>
          <button
            onClick={toggle}
            className="ml-2 p-2 rounded-lg text-muted hover:text-foreground hover:bg-paper transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {user && (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              {isAnonymous ? (
                <Link
                  href="/signup"
                  className="text-xs text-accent hover:text-accent-hover font-medium"
                >
                  Create account
                </Link>
              ) : (
                <span className="text-xs text-muted truncate max-w-[120px]" title={email ?? undefined}>
                  {email}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-paper transition-colors"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
