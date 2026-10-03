"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

export interface TrendPoint {
  day: string;
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No feedback in the last 14 days yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="positive" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="neutral" stroke="#a3a3a3" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="negative" stroke="#dc2626" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
