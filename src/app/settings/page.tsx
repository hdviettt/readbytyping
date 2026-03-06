"use client";

import { Nav } from "@/components/nav";
import { useSettings } from "@/hooks/use-settings";
import { getDefaults, type Settings } from "@/lib/settings";

export default function SettingsPage() {
  const { settings, update } = useSettings();

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold font-typewriter text-accent mb-8">Settings</h1>

        <div className="space-y-6">
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
