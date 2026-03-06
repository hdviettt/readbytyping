"use client";

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

export function WpmLineChart({
  data,
  height = 250,
}: {
  data: WpmSample[];
  height?: number;
}) {
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
        <CartesianGrid strokeDasharray="3 3" stroke="#3d3429" />
        <XAxis dataKey="t" stroke="#8a7a66" tick={{ fontSize: 12 }} />
        <YAxis stroke="#8a7a66" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#231e18",
            border: "1px solid #3d3429",
            borderRadius: "8px",
            fontSize: 13,
            color: "#e8dcc8",
          }}
          labelFormatter={(v) => `${v}s`}
        />
        <Line
          type="monotone"
          dataKey="wpm"
          stroke="#c89b3c"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#c89b3c" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
