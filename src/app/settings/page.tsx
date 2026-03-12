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

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleSaveProfile() {
    setSaving(true);
    setSaveMsg(null);
    const ok = await db.updateProfile({ displayName: displayName.trim() || null });
    setSaving(false);
    setSaveMsg(ok ? "Saved!" : "Failed to save — check console for details");
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-foreground mb-8">Settings</h1>


        <div className="space-y-8">
          {/* Profile section */}
          {user && !isAnonymous && profileLoaded && (
            <SettingsRow label="Profile" description="Your account details">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-dim mb-1">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label htmlFor="displayName" className="text-xs text-dim mb-1 block">
                    Display name
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1 px-3 py-1.5 text-sm bg-transparent border border-border/70 rounded-lg placeholder:text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-background font-medium rounded-full transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {saveMsg && (
                    <p className={`text-xs mt-1 ${saveMsg === "Saved!" ? "text-ink-correct" : "text-ink-error"}`}>
                      {saveMsg}
                    </p>
                  )}
                </div>
              </div>
            </SettingsRow>
          )}

          <SettingsRow label="Typing" description="Sound and visual effects">
            <div className="space-y-0 divide-y divide-border/30">
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
            </div>
          </SettingsRow>

          <SettingsRow label="Display" description="Font size for the typing view">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm tabular-nums font-mono">{settings.fontSize}px</span>
              <input
                type="range"
                min={14}
                max={24}
                step={1}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-40 accent-accent"
              />
            </div>
          </SettingsRow>

          <div className="pt-2">
            <button
              onClick={() => update(getDefaults())}
              className="text-sm text-dim hover:text-muted transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function SettingsRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-8 border-b border-border/30 pb-8">
      <div className="w-36 shrink-0 pt-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-dim mt-0.5">{description}</p>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
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
        <p className="text-xs text-dim mt-0.5">{description}</p>
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
