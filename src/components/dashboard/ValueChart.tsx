"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "Mar 01", value: 18010.50 },
  { date: "Mar 05", value: 18050.00 },
  { date: "Mar 10", value: 18120.25 },
  { date: "Mar 15", value: 17990.00 },
  { date: "Mar 20", value: 18200.75 },
  { date: "Mar 25", value: 18350.00 },
  { date: "Mar 30", value: 18450.50 },
];

export default function ValueChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500">Loading chart...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
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
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10} 
        />
        <YAxis 
          stroke="#6b7280" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#0d0f14',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(212, 175, 55, 0.1)'
          }}
          itemStyle={{ color: '#d4af37' }}
          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Total Value']}
          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
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
