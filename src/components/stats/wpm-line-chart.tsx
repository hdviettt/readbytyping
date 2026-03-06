"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WpmSample } from "@/types/typing";

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function WpmLineChart({
  data,
  height = 250,
}: {
  data: WpmSample[];
  height?: number;
}) {
  const [colors, setColors] = useState({
    grid: "#3d3429",
    axis: "#8a7a66",
    surface: "#231e18",
    border: "#3d3429",
    text: "#e8dcc8",
    accent: "#c89b3c",
  });
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    function updateColors() {
      setColors({
        grid: getCssVar("--border-color"),
        axis: getCssVar("--muted"),
        surface: getCssVar("--surface"),
        border: getCssVar("--border-color"),
        text: getCssVar("--foreground"),
        accent: getCssVar("--accent"),
      });
    }
    updateColors();

    // Watch for theme class changes on <html>
    observerRef.current = new MutationObserver(updateColors);
    observerRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observerRef.current?.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-muted">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="t" stroke={colors.axis} tick={{ fontSize: 12 }} />
        <YAxis stroke={colors.axis} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            fontSize: 13,
            color: colors.text,
          }}
          labelFormatter={(v) => `${v}s`}
        />
        <Line
          type="monotone"
          dataKey="wpm"
          stroke={colors.accent}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: colors.accent }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
