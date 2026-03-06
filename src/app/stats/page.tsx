"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/nav";
import { getSessions, getKeystrokeStats } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import type { SessionRecord, KeystrokeStat } from "@/types/typing";
import dynamic from "next/dynamic";

const WpmLineChart = dynamic(
  () =>
    import("@/components/stats/wpm-line-chart").then((m) => m.WpmLineChart),
  { ssr: false }
);
const KeyHeatmap = dynamic(
  () => import("@/components/stats/key-heatmap").then((m) => m.KeyHeatmap),
  { ssr: false }
);

export default function StatsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [keystrokeStats, setKeystrokeStats] = useState<KeystrokeStat[]>([]);

  useEffect(() => {
    setSessions(getSessions());
    setKeystrokeStats(getKeystrokeStats());
  }, []);

  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((s, r) => s + r.durationSeconds, 0);
  const totalChars = sessions.reduce(
    (s, r) => s + r.totalCharactersTyped,
    0
  );
  const avgWpm =
    totalSessions > 0
      ? Math.round(sessions.reduce((s, r) => s + r.avgWpm, 0) / totalSessions)
      : 0;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(
          (sessions.reduce((s, r) => s + r.accuracy, 0) / totalSessions) * 100
        )
      : 0;

  const latestSession = sessions[0];

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold font-typewriter text-accent mb-8">Typing Stats</h1>

        {totalSessions === 0 ? (
          <p className="text-center text-muted py-12">
            No stats yet. Complete a page of typing to see your metrics.
          </p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard label="Avg WPM" value={avgWpm} color="text-accent" />
              <StatCard
                label="Avg Accuracy"
                value={`${avgAccuracy}%`}
                color="text-ink-correct"
              />
              <StatCard label="Sessions" value={totalSessions} />
              <StatCard
                label="Characters"
                value={totalChars.toLocaleString()}
              />
              <StatCard
                label="Total Time"
                value={`${Math.round(totalTime / 60)}m`}
              />
            </div>

            {/* Latest session WPM chart */}
            {latestSession && latestSession.wpmSamples.length > 0 && (
              <div className="mb-8 p-6 bg-surface rounded-xl border border-border">
                <h2 className="text-lg font-semibold font-typewriter mb-4">
                  Latest Session WPM
                </h2>
                <WpmLineChart data={latestSession.wpmSamples} />
              </div>
            )}

            {/* Key heatmap */}
            <div className="mb-8 p-6 bg-surface rounded-xl border border-border">
              <h2 className="text-lg font-semibold font-typewriter mb-4">
                Key Accuracy Heatmap
              </h2>
              <KeyHeatmap stats={keystrokeStats} />
            </div>

            {/* Session history */}
            <div className="p-6 bg-surface rounded-xl border border-border">
              <h2 className="text-lg font-semibold font-typewriter mb-4">Session History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-3 font-medium">Book</th>
                      <th className="text-right py-3 px-3 font-medium">WPM</th>
                      <th className="text-right py-3 px-3 font-medium">
                        Peak
                      </th>
                      <th className="text-right py-3 px-3 font-medium">
                        Accuracy
                      </th>
                      <th className="text-right py-3 px-3 font-medium">
                        Duration
                      </th>
                      <th className="text-right py-3 px-3 font-medium">
                        Chars
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 30).map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border/50 hover:bg-paper/30"
                      >
                        <td className="py-3 px-3 truncate max-w-[200px]">
                          {s.bookTitle}
                        </td>
                        <td className="py-3 px-3 text-right font-medium font-typewriter">
                          {Math.round(s.avgWpm)}
                        </td>
                        <td className="py-3 px-3 text-right font-typewriter">
                          {Math.round(s.peakWpm)}
                        </td>
                        <td className="py-3 px-3 text-right font-typewriter">
                          {Math.round(s.accuracy * 100)}%
                        </td>
                        <td className="py-3 px-3 text-right font-typewriter">
                          {formatTime(s.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-right font-typewriter">
                          {s.totalCharactersTyped}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="p-4 bg-surface rounded-xl border border-border">
      <p className={`text-2xl font-bold font-typewriter ${color || "text-ink"}`}>
        {value}
      </p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
