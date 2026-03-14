"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface CardPriceChartProps {
  cardId: string;
  game: string;
}

export default function CardPriceChart({ cardId, game }: CardPriceChartProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/card-price?cardId=${encodeURIComponent(cardId)}&game=${encodeURIComponent(game)}`);
        if (!res.ok) throw new Error("Failed to fetch price");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPrice();
  }, [cardId, game]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs uppercase tracking-widest">Fetching market data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-xs uppercase tracking-widest">Price data unavailable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Price Header */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-bold font-mono text-gold-gradient">
          {data.currentPrice !== null
            ? `${data.currency === "EUR" ? "€" : "$"}${data.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : "N/A"
          }
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {data.source} • {data.currency}
        </span>
      </div>

      {/* Chart */}
      {data.priceHistory && data.priceHistory.length > 0 ? (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.priceHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="detailGoldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${data.currency === "EUR" ? "€" : "$"}${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16191f',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#d4af37' }}
                formatter={(value: any) => [
                  `${data.currency === "EUR" ? "€" : "$"}${Number(value).toFixed(2)}`,
                  'Price'
                ]}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="price" stroke="#e5c048" strokeWidth={2}
                fillOpacity={1} fill="url(#detailGoldGradient)"
                activeDot={{ r: 5, fill: "#d4af37", stroke: "#1c2028", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-dashed border-gray-800 rounded-lg">
          <p className="text-gray-600 text-xs uppercase tracking-widest">No price history available</p>
        </div>
      )}
    </div>
  );
}
