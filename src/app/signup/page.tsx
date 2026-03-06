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
          <div className="border-2 border-border bg-surface px-6 py-8 text-center">
            <div className="stamp animate-stamp text-lg mx-auto w-fit mb-4">
              Pending
            </div>
            <p className="text-sm text-foreground font-bold uppercase tracking-wider mb-2">
              Verification Required
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Confirmation dispatched to <span className="text-foreground font-bold">{email}</span>.
              Follow the link to complete registration.
            </p>
            <Link href="/login" className="inline-block mt-4 text-[11px] text-accent hover:text-accent-hover uppercase font-bold tracking-wider">
              Return to Authorization
            </Link>
          </div>
        </div>
      </main>
    );
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
            New Registration
          </h1>
          <p className="text-[10px] text-muted tracking-wider uppercase mt-1">
            Fill in all fields to register
          </p>
        </div>

        {/* Form body */}
        <div className="border-2 border-t-0 border-border bg-surface/50 px-6 py-5">
          {error && (
            <div className="mb-4 px-3 py-2 border-2 border-stamp/40 bg-stamp/10">
              <p className="text-xs text-stamp font-bold uppercase tracking-wider">
                Rejected: {error}
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
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-background font-bold text-xs tracking-[0.2em] uppercase transition-colors disabled:opacity-50 border-2 border-accent hover:border-accent-hover"
            >
              {loading ? "Processing..." : "Submit Registration"}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted mt-4 tracking-wider">
            Already registered?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover uppercase font-bold">
              Authorize
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
