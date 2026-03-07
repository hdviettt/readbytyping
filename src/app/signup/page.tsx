"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const isAnonymous = currentUser?.is_anonymous;

    if (isAnonymous) {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-surface/50 border border-border/50 rounded-xl p-8 text-center">
          <span className="badge badge-accent animate-badge">Pending</span>
          <p className="text-base font-semibold text-foreground mt-4 mb-2">
            Check your email
          </p>
          <p className="text-[13px] text-muted leading-relaxed">
            We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
            Click the link to complete registration.
          </p>
          <Link href="/login" className="inline-block mt-4 text-sm text-accent hover:text-accent-hover font-medium">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-accent font-bold text-lg">BT</span>
          <h1 className="text-lg font-semibold text-foreground mt-2">Create account</h1>
          <p className="text-[13px] text-muted mt-1">Register to save your progress</p>
        </div>

        <div className="bg-surface/50 border border-border/50 rounded-xl p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-ink-error/8 border border-ink-error/20 rounded-lg">
              <p className="text-sm text-ink-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-dim mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-transparent border border-border/70 rounded-lg placeholder:text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-dim mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm bg-transparent border border-border/70 rounded-lg placeholder:text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-muted mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
