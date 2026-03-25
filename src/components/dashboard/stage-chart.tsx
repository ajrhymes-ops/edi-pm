"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StageChartProps {
  data: { name: string; count: number; color: string }[];
}

export function StageChart({ data }: StageChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No project data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          cursor={{ fill: "var(--accent)", opacity: 0.3 }}
          formatter={(value) => [`${value} project${value !== 1 ? "s" : ""}`, "Count"]}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
