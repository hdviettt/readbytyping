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

  const links = [
    { href: "/", label: "Library" },
    { href: "/stats", label: "Stats" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 border border-accent rounded-md flex items-center justify-center">
              <span className="text-accent text-xs font-bold leading-none">BT</span>
            </div>
            <span className="text-sm font-semibold font-serif text-foreground hidden sm:block">
              BookTyper
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                  {active && (
                    <div className="h-0.5 bg-accent rounded-full mt-0.5 -mb-1" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side — controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-1.5 text-muted hover:text-foreground transition-colors rounded-md"
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
              <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
                {isAnonymous ? (
                  <Link
                    href="/signup"
                    className="text-xs bg-accent/10 text-accent rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-accent/20"
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
                  className="p-1.5 text-dim hover:text-ink-error transition-colors rounded-md"
                  title="Sign out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
