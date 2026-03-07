"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { useStore } from "@/hooks/use-store";
import { formatTime } from "@/lib/utils";
import { CountUp } from "@/components/count-up";
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

const PAGE_SIZE = 20;

export default function StatsPage() {
  const { sessions, keystrokeStats, loading } = useStore();
  const [page, setPage] = useState(0);

  if (loading) {
    return (
      <>
        <Nav />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-center text-muted py-12 animate-pulse">Loading...</p>
        </main>
      </>
    );
  }

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

  const bestSession = sessions.length > 0
    ? sessions.reduce((best, s) => (s.avgWpm > best.avgWpm ? s : best), sessions[0])
    : null;

  const latestSession = sessions[0];

  const trendData = [...sessions]
    .reverse()
    .map((s, i) => ({
      t: i + 1,
      wpm: Math.round(s.avgWpm),
    }));

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const paginatedSessions = sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-8">Your Statistics</h1>

        {totalSessions === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <svg
              viewBox="0 0 120 80"
              className="w-24 h-20 mx-auto mb-4 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="20" y1="10" x2="20" y2="65" />
              <line x1="20" y1="65" x2="100" y2="65" />
              <line x1="25" y1="55" x2="95" y2="55" strokeDasharray="4 4" className="stroke-dim" />
            </svg>
            <p className="text-muted font-medium mb-1">No stats yet</p>
            <p className="text-dim text-sm">Complete a page of typing to see your metrics.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 stagger-children">
              <StatCard label="Avg WPM" color="text-accent">
                <CountUp end={avgWpm} className="text-2xl font-mono tabular-nums font-semibold" />
              </StatCard>
              <StatCard label="Avg Accuracy" color="text-ink-correct">
                <CountUp end={avgAccuracy} suffix="%" className="text-2xl font-mono tabular-nums font-semibold" />
              </StatCard>
              <StatCard label="Sessions">
                <CountUp end={totalSessions} className="text-2xl font-mono tabular-nums font-semibold" />
              </StatCard>
              <StatCard label="Characters">
                <CountUp end={totalChars} className="text-2xl font-mono tabular-nums font-semibold" />
              </StatCard>
              <StatCard label="Total Time">
                <span className="text-2xl font-mono tabular-nums font-semibold">{Math.round(totalTime / 60)}m</span>
              </StatCard>
            </div>

            {/* Best session highlight */}
            {bestSession && (
              <div className="mb-8 p-5 bg-surface rounded-lg border border-accent/30">
                <h2 className="text-xs text-muted mb-3">Best Session</h2>
                <div className="flex items-center gap-6 text-sm">
                  <span className="font-mono text-xl font-semibold text-accent">{Math.round(bestSession.avgWpm)} WPM</span>
                  <span className="text-muted">{Math.round(bestSession.accuracy * 100)}% accuracy</span>
                  <span className="text-muted truncate">{bestSession.bookTitle}</span>
                  <span className="text-dim ml-auto">{formatDate(bestSession.startedAt)}</span>
                </div>
              </div>
            )}

            {/* WPM trend chart */}
            {trendData.length > 1 && (
              <div className="mb-8 p-6 bg-surface rounded-lg border border-border">
                <h2 className="text-xl font-serif font-medium mb-4">
                  WPM Over Time
                </h2>
                <WpmLineChart data={trendData} />
              </div>
            )}

            {/* Latest session WPM chart */}
            {latestSession && latestSession.wpmSamples.length > 0 && (
              <div className="mb-8 p-6 bg-surface rounded-lg border border-border">
                <h2 className="text-xl font-serif font-medium mb-4">
                  Latest Session WPM
                </h2>
                <WpmLineChart data={latestSession.wpmSamples} />
              </div>
            )}

            {/* Key heatmap */}
            <div className="mb-8 p-6 bg-surface rounded-lg border border-border">
              <h2 className="text-xl font-serif font-medium mb-4">
                Key Accuracy Heatmap
              </h2>
              <KeyHeatmap stats={keystrokeStats} />
            </div>

            {/* Session history */}
            <div className="p-6 bg-surface rounded-lg border border-border">
              <h2 className="text-xl font-serif font-medium mb-4">Session History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="text-left py-3 px-3 font-medium">Book</th>
                      <th className="text-right py-3 px-3 font-medium">WPM</th>
                      <th className="text-right py-3 px-3 font-medium">Peak</th>
                      <th className="text-right py-3 px-3 font-medium">Accuracy</th>
                      <th className="text-right py-3 px-3 font-medium">Duration</th>
                      <th className="text-right py-3 px-3 font-medium">Chars</th>
                      <th className="text-right py-3 px-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border/50 hover:bg-paper/30"
                      >
                        <td className="py-3 px-3 truncate max-w-[200px]">
                          {s.bookTitle}
                        </td>
                        <td className="py-3 px-3 text-right font-medium font-mono tabular-nums">
                          {Math.round(s.avgWpm)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {Math.round(s.peakWpm)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {Math.round(s.accuracy * 100)}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatTime(s.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {s.totalCharactersTyped}
                        </td>
                        <td className="py-3 px-3 text-right text-dim whitespace-nowrap">
                          {formatDate(s.startedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-sm text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-dim">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="text-sm text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  color,
  children,
}: {
  label: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-surface rounded-lg border border-border shadow-sm">
      <div className={color || "text-foreground"}>
        {children}
      </div>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
