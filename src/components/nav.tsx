"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { ThemeConfigurator } from "@/components/theme-configurator";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, isAnonymous, signOut } = useAuth();
  const [themeOpen, setThemeOpen] = useState(false);

  const email = user?.email;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const links = [
    { href: "/", label: "Library" },
    { href: "/stats", label: "Stats" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-11">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-accent font-bold text-sm">BT</span>
            <span className="text-sm font-medium text-foreground/80 hidden sm:block">
              BookTyper
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1 text-[13px] font-medium transition-colors",
                    active
                      ? "text-foreground bg-border/40"
                      : "text-muted hover:text-foreground hover:bg-border/20"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-1.5 text-muted hover:text-foreground transition-colors hover:bg-border/20"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setThemeOpen(true)}
              className="p-1.5 text-muted hover:text-foreground transition-colors hover:bg-border/20"
              title="Customize theme"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2" />
                <circle cx="17.5" cy="10.5" r="2" />
                <circle cx="8.5" cy="7.5" r="2" />
                <circle cx="6.5" cy="12" r="2" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </button>

            {user && (
              <div className="flex items-center gap-1.5 border-l border-border/50 pl-2 ml-0.5">
                {isAnonymous ? (
                  <Link
                    href="/signup"
                    className="text-xs text-accent hover:text-accent-hover font-medium px-2 py-0.5 hover:bg-accent/10 transition-colors"
                  >
                    Register
                  </Link>
                ) : (
                  <span className="text-xs text-muted truncate max-w-[100px]" title={email ?? undefined}>
                    {email}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-1 text-dim hover:text-foreground transition-colors hover:bg-border/20"
                  title="Sign out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ThemeConfigurator isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
    </header>
  );
}
