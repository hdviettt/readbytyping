"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/nav";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { getDefaults, type Settings } from "@/lib/settings";
import * as db from "@/lib/supabase-store";

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { user, isAnonymous } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    db.getProfile().then((p) => {
      if (p?.displayName) setDisplayName(p.displayName);
      setProfileLoaded(true);
    });
  }, [user]);

  async function handleSaveProfile() {
    setSaving(true);
    await db.updateProfile({ displayName: displayName.trim() || null });
    setSaving(false);
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold font-typewriter text-accent mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile section */}
          {user && !isAnonymous && profileLoaded && (
            <Section title="Profile">
              <div className="py-3 space-y-3">
                <div>
                  <p className="text-xs text-muted mb-1">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label htmlFor="displayName" className="text-xs text-muted mb-1 block">
                    Display name
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg placeholder:text-dim focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-background rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}

          <Section title="Typing">
            <Toggle
              label="Sound effects"
              description="Typewriter keystroke sounds"
              checked={settings.soundEnabled}
              onChange={(v) => update({ soundEnabled: v })}
            />
            <Toggle
              label="On-screen keyboard"
              description="Show the virtual keyboard below the text"
              checked={settings.keyboardVisible}
              onChange={(v) => update({ keyboardVisible: v })}
            />
            <Toggle
              label="Streak effects"
              description="Particle burst on typing streaks"
              checked={settings.streakEffects}
              onChange={(v) => update({ streakEffects: v })}
            />
            <Toggle
              label="Screen shake"
              description="Shake on high streaks"
              checked={settings.screenShake}
              onChange={(v) => update({ screenShake: v })}
            />
          </Section>

          <Section title="Display">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Font size</p>
                <p className="text-xs text-muted mt-0.5">{settings.fontSize}px</p>
              </div>
              <input
                type="range"
                min={14}
                max={24}
                step={1}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-32 accent-accent"
              />
            </div>
          </Section>

          <button
            onClick={() => update(getDefaults())}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 bg-surface rounded-xl border border-border">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}
