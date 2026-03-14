"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Activity, CreditCard, Sparkles, Clock } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

// Dummy data for the time being since the database isn't hooked up yet
const RECENT_ACTIVITY = [
  { id: 1, action: "Added to collection", card: "Charizard - Base Set (Holo)", price: 350.50, date: "2 hours ago", type: "add" },
  { id: 2, action: "Price increased", card: "Black Lotus - Alpha", price: 15400.00, date: "5 hours ago", type: "up" },
  { id: 3, action: "Added to collection", card: "Monkey D. Luffy - Manga Rare", price: 1200.00, date: "1 day ago", type: "add" },
  { id: 4, action: "Price decreased", card: "Umbreon VMAX - Evolving Skies", price: 580.00, date: "2 days ago", type: "down" },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="container mx-auto px-6 lg:px-12 py-10 pb-24">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">Command Center</h1>
          <p className="text-gray-400 text-sm">Welcome back to your vault. Here&apos;s your collection at a glance.</p>
        </div>
        <button className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-medium tracking-wider uppercase transition-all vault-glow self-start md:self-auto">
          Add New Card
        </button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Value */}
        <div className="p-6 bg-vault-800 vault-border rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-gold-500" />
          </div>
          <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Total Value</h3>
          <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight text-gold-gradient">
            {mounted ? <AnimatedCounter prefix="$" value={18450.50} decimals={2} duration={2.5} /> : "$0.00"}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>2.4% (+$440.00)</span>
            <span className="text-gray-500 ml-1">past 30 days</span>
          </div>
        </div>

        {/* Total Cards */}
        <div className="p-6 bg-vault-800 vault-border rounded-xl relative overflow-hidden">
          <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Total Cards</h3>
          <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight">
            {mounted ? <AnimatedCounter value={142} duration={1.5} /> : "0"}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard className="w-4 h-4 text-gold-500/50" />
            <span>Across 3 games</span>
          </div>
        </div>

        {/* Most Valuable Card */}
        <div className="p-6 bg-vault-800 vault-border rounded-xl col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-between vault-glow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 blur-2xl rounded-full" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <h3 className="text-gold-400 font-bold uppercase tracking-wider text-xs">Crown Jewel</h3>
            </div>
            <p className="text-xl font-bold text-white mb-1 truncate">Black Lotus - Alpha Edition</p>
            <p className="text-sm text-gray-400">Magic: The Gathering</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="text-3xl font-bold text-white font-mono tracking-tight">
              {mounted ? <AnimatedCounter prefix="$" value={15400.00} decimals={2} duration={2} /> : "$0.00"}
            </div>
            <button className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-300 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placeholder for Recharts Graph */}
        <div className="lg:col-span-2 p-6 bg-vault-800 vault-border rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Value History</h3>
            <select className="bg-vault-900 border border-gray-800 text-gray-300 text-xs uppercase tracking-wider rounded px-3 py-1 outline-none">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>1 Year</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px] border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center gap-3 bg-vault-900/50">
             {/* 
                We will replace this placeholder with a Recharts component once the package is successfully installed.
             */}
             <Activity className="w-8 h-8 text-gold-500/30 mb-2" />
             <p className="text-gray-500 uppercase tracking-widest text-sm">Chart Data Loading</p>
             <p className="text-gray-600 text-xs">(Requires Recharts installation)</p>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="p-6 bg-vault-800 vault-border rounded-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gold-400" />
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Recent Activity</h3>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="p-4 rounded-lg bg-vault-900 border border-gray-800/50 hover:border-gold-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                    {activity.action}
                  </span>
                  <span className="text-xs text-gray-600">{activity.date}</span>
                </div>
                <p className="text-sm text-white font-medium mb-2">{activity.card}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-gold-gradient font-mono font-bold text-sm">
                    ${activity.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  {activity.type === 'up' && <ArrowUpRight className="w-4 h-4 text-green-400" />}
                  {activity.type === 'down' && <ArrowDownRight className="w-4 h-4 text-red-400" />}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-gray-800 hover:border-gold-500/50 rounded-lg text-xs uppercase tracking-widest text-gray-400 hover:text-gold-400 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
