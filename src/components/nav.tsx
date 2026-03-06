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
    { href: "/", label: "LIBRARY" },
    { href: "/stats", label: "RECORDS" },
    { href: "/settings", label: "CONFIG" },
  ];

  return (
    <header className="bg-surface border-b-2 border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo — like a department header */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent flex items-center justify-center">
              <span className="text-accent text-xs font-bold leading-none">BT</span>
            </div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-foreground hidden sm:block">
              BookTyper
            </span>
          </Link>

          {/* Nav tabs — dossier folder tabs */}
          <nav className="flex items-center gap-0">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-1 text-[11px] font-bold tracking-[0.15em] uppercase border-2 border-b-0 -mb-[2px] transition-colors",
                    active
                      ? "bg-background border-border text-accent"
                      : "bg-transparent border-transparent text-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side — controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-1.5 text-muted hover:text-foreground transition-colors"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {user && (
              <div className="flex items-center gap-2 border-l-2 border-border pl-2 ml-1">
                {isAnonymous ? (
                  <Link
                    href="/signup"
                    className="stamp text-[9px] py-0 px-2 border-2"
                    style={{ transform: "rotate(0deg)" }}
                  >
                    Register
                  </Link>
                ) : (
                  <span className="text-[10px] text-muted tracking-wider uppercase truncate max-w-[100px]" title={email ?? undefined}>
                    {email}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-dim hover:text-stamp transition-colors"
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
