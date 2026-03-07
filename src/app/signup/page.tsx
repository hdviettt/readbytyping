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
        <div className="w-full max-w-sm">
          <div className="border border-border bg-surface rounded-lg px-6 py-8 text-center">
            <span className="badge badge-accent animate-badge text-sm mx-auto mb-4">
              Pending
            </span>
            <p className="text-base font-serif font-semibold text-foreground mb-2">
              Check your email
            </p>
            <p className="text-sm text-muted leading-relaxed">
              We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
              Click the link to complete your registration.
            </p>
            <Link href="/login" className="inline-block mt-4 text-sm text-accent hover:text-accent-hover font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
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
            Create Account
          </h1>
          <p className="text-sm text-muted mt-1">
            Register to save your progress
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
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-medium text-sm rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
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
