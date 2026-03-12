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
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="py-12 space-y-3 max-w-lg mx-auto animate-pulse">
            <div className="h-3 bg-border/30 rounded-full w-3/4" />
            <div className="h-3 bg-border/30 rounded-full w-1/2" />
            <div className="h-3 bg-border/30 rounded-full w-2/3" />
          </div>
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
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-xl font-serif font-semibold text-foreground mb-8">Statistics</h1>

        {totalSessions === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <svg
              viewBox="0 0 120 80"
              className="w-20 h-16 mx-auto mb-4 text-dim"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="20" y1="10" x2="20" y2="65" />
              <line x1="20" y1="65" x2="100" y2="65" />
              <line x1="25" y1="55" x2="95" y2="55" strokeDasharray="4 4" className="stroke-dim" />
            </svg>
            <p className="text-muted text-sm mb-1">No stats yet</p>
            <p className="text-dim text-xs">Complete a page of typing to see your metrics.</p>
          </div>
        ) : (
          <>
            {/* Hero stats — two large + three small */}
            <div className="flex gap-3 mb-8 stagger-children">
              {/* Primary stats — large */}
              <div className="flex-1 p-5 bg-surface/50 border border-border/50 rounded-xl flex items-end justify-between">
                <div>
                  <CountUp end={avgWpm} className="text-4xl font-mono tabular-nums font-bold text-accent" />
                  <p className="text-xs text-dim mt-1">Average WPM</p>
                </div>
                {bestSession && (
                  <div className="text-right">
                    <p className="text-lg font-mono tabular-nums font-semibold text-accent/60">{Math.round(bestSession.avgWpm)}</p>
                    <p className="text-[11px] text-dim">Best</p>
                  </div>
                )}
              </div>
              <div className="flex-1 p-5 bg-surface/50 border border-border/50 rounded-xl flex items-end justify-between">
                <div>
                  <CountUp end={avgAccuracy} suffix="%" className="text-4xl font-mono tabular-nums font-bold text-ink-correct" />
                  <p className="text-xs text-dim mt-1">Average Accuracy</p>
                </div>
              </div>
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="p-4 bg-surface/30 border border-border/40 rounded-lg">
                <CountUp end={totalSessions} className="text-xl font-mono tabular-nums font-semibold" />
                <p className="text-xs text-dim mt-0.5">Sessions</p>
              </div>
              <div className="p-4 bg-surface/30 border border-border/40 rounded-lg">
                <CountUp end={totalChars} className="text-xl font-mono tabular-nums font-semibold" />
                <p className="text-xs text-dim mt-0.5">Characters</p>
              </div>
              <div className="p-4 bg-surface/30 border border-border/40 rounded-lg">
                <span className="text-xl font-mono tabular-nums font-semibold">{Math.round(totalTime / 60)}m</span>
                <p className="text-xs text-dim mt-0.5">Total Time</p>
              </div>
            </div>

            {/* Charts — side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
              {trendData.length > 1 && (
                <div className="p-5 bg-surface/50 border border-border/50 rounded-xl">
                  <h2 className="text-sm font-serif font-medium text-muted mb-4">WPM Over Time</h2>
                  <WpmLineChart data={trendData} />
                </div>
              )}

              {latestSession && latestSession.wpmSamples.length > 0 && (
                <div className="p-5 bg-surface/50 border border-border/50 rounded-xl">
                  <h2 className="text-sm font-serif font-medium text-muted mb-4">Latest Session</h2>
                  <WpmLineChart data={latestSession.wpmSamples} />
                </div>
              )}
            </div>

            {/* Key heatmap — full width */}
            <div className="mb-8 p-5 bg-surface/50 border border-border/50 rounded-xl">
              <h2 className="text-sm font-serif font-medium text-muted mb-4">Key Accuracy</h2>
              <KeyHeatmap stats={keystrokeStats} />
            </div>

            {/* Session history */}
            <div className="bg-surface/50 border border-border/50 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40">
                <h2 className="text-sm font-serif font-medium text-muted">Session History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-dim text-xs">
                      <th className="text-left py-2.5 px-4 font-medium">Book</th>
                      <th className="text-right py-2.5 px-4 font-medium">WPM</th>
                      <th className="text-right py-2.5 px-4 font-medium">Peak</th>
                      <th className="text-right py-2.5 px-4 font-medium">Acc</th>
                      <th className="text-right py-2.5 px-4 font-medium">Duration</th>
                      <th className="text-right py-2.5 px-4 font-medium">Chars</th>
                      <th className="text-right py-2.5 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border/30 hover:bg-border/10 transition-colors"
                      >
                        <td className="py-2.5 px-4 truncate max-w-[200px] text-[13px]">
                          {s.bookTitle}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium font-mono tabular-nums text-[13px]">
                          {Math.round(s.avgWpm)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-dim text-[13px]">
                          {Math.round(s.peakWpm)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[13px]">
                          {Math.round(s.accuracy * 100)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-dim text-[13px]">
                          {formatTime(s.durationSeconds)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-dim text-[13px]">
                          {s.totalCharactersTyped}
                        </td>
                        <td className="py-2.5 px-4 text-right text-dim text-xs whitespace-nowrap">
                          {formatDate(s.startedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-xs text-muted hover:text-foreground hover:bg-border/20 px-2 py-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-dim tabular-nums font-mono">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="text-xs text-muted hover:text-foreground hover:bg-border/20 px-2 py-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
