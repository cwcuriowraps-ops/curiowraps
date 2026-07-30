"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: any[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-text-secondary">
        No revenue data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
        <Tooltip 
          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          formatter={(value: number) => [`₹${value}`, "Revenue"]}
        />
        <Line type="monotone" dataKey="revenue" stroke="#e5b3c5" strokeWidth={2} dot={{ r: 4, fill: "#e5b3c5" }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
