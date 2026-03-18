"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";

interface SnapshotRow {
  snapshot_date: string;
  total_value: number;
}

interface ChartPoint {
  date: string;
  value: number;
}

// Filtra snapshots según el rango seleccionado
function filterByRange(data: ChartPoint[], range: string): ChartPoint[] {
  const now = Date.now();
  const days: Record<string, number> = { "7D": 7, "30D": 30, "3M": 90, "1Y": 365 };
  const cutoff = now - (days[range] ?? 30) * 24 * 60 * 60 * 1000;
  return data.filter((d) => new Date(d.date).getTime() >= cutoff);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ValueChartProps {
  range?: string;
}

export default function ValueChart({ range = "30D" }: ValueChartProps) {
  const [mounted, setMounted] = useState(false);
  const [snapshots, setSnapshots] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  // Cargar snapshots reales de Supabase
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("portfolio_snapshots")
          .select("snapshot_date, total_value")
          .eq("user_id", user.id)
          .order("snapshot_date", { ascending: true })
          .limit(365);

        if (error || !data) return;

        const points: ChartPoint[] = (data as SnapshotRow[]).map((row) => ({
          date: row.snapshot_date,
          value: row.total_value,
        }));

        if (!cancelled) setSnapshots(points);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = filterByRange(snapshots, range);

  // Si no hay snapshots reales, mostrar datos de demostración
  const displayData: ChartPoint[] = filtered.length > 0
    ? filtered
    : (loading ? [] : [
        // Placeholder flat line con el valor actual = 0
        { date: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), value: 0 },
        { date: new Date().toISOString().slice(0, 10), value: 0 },
      ]);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">Loading…</div>;
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border border-gold-500/30 border-t-gold-500 animate-spin" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-600">No history yet</p>
        <p className="text-xs text-gray-700">Portfolio snapshots are saved daily. Check back tomorrow.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1e28" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={10}
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0d0f14",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.1)",
          }}
          itemStyle={{ color: "#d4af37" }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Total Value"]}
          labelFormatter={(label) => formatDate(String(label))}
          labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#e5c048"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
          activeDot={{ r: 6, fill: "#d4af37", stroke: "#1c2028", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
