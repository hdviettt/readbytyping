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
        {/* Document header */}
        <div className="border-2 border-border bg-surface px-6 py-4 text-center">
          <div className="w-10 h-10 border-2 border-accent mx-auto mb-3 flex items-center justify-center">
            <span className="text-accent text-sm font-bold">BT</span>
          </div>
          <h1 className="text-sm font-bold tracking-[0.25em] uppercase text-foreground">
            Authorization Required
          </h1>
          <p className="text-[10px] text-muted tracking-wider uppercase mt-1">
            Present credentials to proceed
          </p>
        </div>

        {/* Form body */}
        <div className="border-2 border-t-0 border-border bg-surface/50 px-6 py-5">
          {error && (
            <div className="mb-4 px-3 py-2 border-2 border-stamp/40 bg-stamp/10">
              <p className="text-xs text-stamp font-bold uppercase tracking-wider">
                Denied: {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-dim mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border placeholder:text-dim focus:outline-none focus:border-accent font-typewriter"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-dim mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm bg-background border-2 border-border placeholder:text-dim focus:outline-none focus:border-accent font-typewriter"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-bold text-xs tracking-[0.2em] uppercase transition-colors disabled:opacity-50 border-2 border-accent hover:border-accent-hover"
            >
              {loading ? "Verifying..." : "Authorize"}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted mt-4 tracking-wider">
            No credentials?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-hover uppercase font-bold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
