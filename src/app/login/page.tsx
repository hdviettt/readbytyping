"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="border border-border bg-surface rounded-t-lg px-6 py-5 text-center">
          <div className="w-10 h-10 border border-accent rounded-md mx-auto mb-3 flex items-center justify-center">
            <span className="text-accent text-sm font-bold">BT</span>
          </div>
          <h1 className="text-xl font-serif font-semibold text-foreground">
            Sign In
          </h1>
          <p className="text-sm text-muted mt-1">
            Enter your credentials to continue
          </p>
        </div>

        {/* Form body */}
        <div className="border border-t-0 border-border bg-surface/50 rounded-b-lg px-6 py-5">
          {error && (
            <div className="mb-4 px-4 py-3 border border-ink-error/30 bg-ink-error/10 rounded-md">
              <p className="text-sm text-ink-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-muted mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md placeholder:text-dim focus:outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-muted mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md placeholder:text-dim focus:outline-none focus:border-accent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-medium text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-hover font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
