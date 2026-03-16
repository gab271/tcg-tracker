"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownRight, Sparkles, Clock,
  Plus, Zap, Star, TrendingUp,
} from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ValueChart from "@/components/dashboard/ValueChart";

const RECENT_ACTIVITY = [
  { id: 1, action: "Added", card: "Charizard - Base Set (Holo)", price: 350.50,  date: "2h ago",  type: "add", game: "PKM" },
  { id: 2, action: "Price ↑", card: "Black Lotus - Alpha",         price: 15400.00, date: "5h ago",  type: "up",  game: "MTG" },
  { id: 3, action: "Added", card: "Monkey D. Luffy - Manga Rare", price: 1200.00, date: "1d ago",  type: "add", game: "OP"  },
  { id: 4, action: "Price ↓", card: "Umbreon VMAX - Evolving Skies", price: 580.00, date: "2d ago",  type: "down", game: "PKM" },
];

const GAME_DISTRIBUTION = [
  { name: "Pokémon TCG", abbr: "PKM", pct: 45, color: "#ef4444", count: 64 },
  { name: "Magic: The Gathering", abbr: "MTG", pct: 30, color: "#3b82f6", count: 43 },
  { name: "One Piece TCG", abbr: "OP",  pct: 15, color: "#eab308", count: 21 },
  { name: "Yu-Gi-Oh!",  abbr: "YGO", pct: 10, color: "#a855f7", count: 14 },
];

const GAME_BADGE: Record<string, string> = {
  PKM: "bg-red-950/60 text-red-300 border-red-800/50",
  MTG: "bg-blue-950/60 text-blue-300 border-blue-800/50",
  OP:  "bg-yellow-950/60 text-yellow-300 border-yellow-800/50",
  YGO: "bg-purple-950/60 text-purple-300 border-purple-800/50",
};

const cardAnim = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.09, duration: 0.5, type: "spring" as const, damping: 22 },
  }),
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState("30D");

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {/* ━━━ BATTLEFIELD BACKGROUND ━━━ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#080a0d]" />
        {/* Hex-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 1L55 16v16L28 47 1 32V16Z' fill='none' stroke='%23d4af37' stroke-width='0.6'/%3E%3C/svg%3E")`,
            backgroundSize: "56px 48px",
          }}
        />
        {/* Ambient energy orbs */}
        <div className="absolute -top-20 right-1/3 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/4 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-0 w-72 h-72 bg-red-500/3 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 right-0 w-60 h-60 bg-purple-500/3 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 px-5 lg:px-10 py-8 pb-28 max-w-[1440px] mx-auto">

        {/* ━━━ HEADER ━━━ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-2.5 px-2.5 py-1 rounded-lg bg-gold-500/8 border border-gold-500/18">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <span className="text-[9px] font-bold text-gold-400/80 uppercase tracking-[0.2em]">Legend Rank</span>
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse ml-0.5" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white tracking-wide leading-none mb-1">
              Command Center
            </h1>
            <p className="text-gray-600 text-xs tracking-wide">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_22px_rgba(212,175,55,0.28)] hover:shadow-[0_0_32px_rgba(212,175,55,0.45)] self-start"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </motion.button>
        </motion.div>

        {/* ━━━ TOP STAT CARDS ━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">

          {/* ── Total Power / Value ── */}
          <motion.div
            custom={0} variants={cardAnim} initial="hidden" animate="show"
            className="sm:col-span-1 lg:col-span-3 relative rounded-2xl overflow-hidden p-5 group cursor-default"
            style={{ background: "linear-gradient(135deg, #1c1608 0%, #0f1115 100%)", border: "1px solid rgba(212,175,55,0.22)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.1),transparent_65%)]" />
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-25 transition-opacity">
              <Zap className="w-10 h-10 text-gold-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-bold text-gold-500/60 uppercase tracking-[0.22em] mb-4">
                ⚡ Total Power
              </p>
              <div className="font-display text-[1.9rem] font-bold text-gold-gradient font-mono leading-none mb-3">
                {mounted ? <AnimatedCounter prefix="$" value={18450.50} decimals={2} duration={2.5} /> : "$0.00"}
              </div>
              {/* Energy bar */}
              <div className="mb-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] text-gray-700 uppercase tracking-widest">Power Level</span>
                  <span className="text-[8px] font-mono text-gold-500/60">73 / 100</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-gold-900/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "73%" }}
                    transition={{ delay: 0.7, duration: 1.4, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>+2.4% this month</span>
              </div>
            </div>
          </motion.div>

          {/* ── Deck Size / Cards ── */}
          <motion.div
            custom={1} variants={cardAnim} initial="hidden" animate="show"
            className="sm:col-span-1 lg:col-span-2 relative rounded-2xl overflow-hidden p-5 group cursor-default"
            style={{ background: "linear-gradient(135deg, #0e1018 0%, #0f1115 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Stacked-cards watermark */}
            <div className="absolute bottom-3 right-3 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
              <div className="relative w-10 h-14">
                <div className="absolute inset-0 rotate-[8deg] bg-gray-500 rounded-sm" />
                <div className="absolute inset-0 rotate-[4deg] bg-gray-400 rounded-sm" />
                <div className="absolute inset-0 bg-gray-300 rounded-sm" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.22em] mb-4">
                🃏 Deck Size
              </p>
              <div className="font-display text-[1.9rem] font-bold text-white font-mono leading-none mb-3">
                {mounted ? <AnimatedCounter value={142} duration={1.5} /> : "0"}
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-600">3 games · 8 sets</p>
                <p className="text-[10px] text-gray-700">12 holo · 4 PSA graded</p>
              </div>
            </div>
          </motion.div>

          {/* ── Crown Jewel ── HOLOGRAPHIC CARD ── */}
          <motion.div
            custom={2} variants={cardAnim} initial="hidden" animate="show"
            className="sm:col-span-2 lg:col-span-7 relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between cursor-pointer group"
            style={{
              background: "linear-gradient(145deg, #140e04 0%, #0d1020 50%, #0a0a14 100%)",
              border: "2px solid rgba(212,175,55,0.3)",
            }}
          >
            {/* Layered holo glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_60%,rgba(212,175,55,0.13),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_30%,rgba(59,130,246,0.07),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(139,92,246,0.05),transparent_60%)]" />
            {/* Holo shimmer sweep */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
              style={{ animation: "holoshimmer 7s ease-in-out 2s infinite" }}
            >
              <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />
            </div>
            {/* Inner border */}
            <div className="absolute inset-[3px] rounded-xl border border-gold-500/12 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  <span className="text-[9px] font-bold text-gold-400/75 uppercase tracking-[0.22em]">Crown Jewel</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-gold-500 text-gold-500" />
                    ))}
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-white leading-tight mb-0.5">Black Lotus</h2>
                <p className="text-xs text-gray-500">Magic: The Gathering · Alpha Edition</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-blue-950/60 border border-blue-800/40 text-blue-300">
                  MTG · Alpha
                </span>
                <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-amber-950/60 border border-amber-700/30 text-amber-300">
                  LP · PSA 9
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-end justify-between mt-5 flex-wrap gap-4">
              <div>
                <p className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">Market Value</p>
                <div className="font-display text-4xl font-bold text-white font-mono leading-none">
                  {mounted ? <AnimatedCounter prefix="$" value={15400.00} decimals={2} duration={2} /> : "$0.00"}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+$1,200 this month</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">Acquired at</p>
                <p className="font-mono text-xl font-bold text-gray-500">$11,800</p>
                <p className="text-xs text-gold-400/70 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-0.5" />
                  +30.5% ROI
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ━━━ BOTTOM GRID ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Value Chart — 8 cols ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="lg:col-span-8 rounded-2xl border border-gray-800/40 p-5 flex flex-col"
            style={{ background: "rgba(22, 25, 31, 0.55)" }}
          >
            <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-white tracking-wide">Value History</h3>
                <p className="text-[10px] text-gray-600 mt-0.5">Portfolio performance · All games</p>
              </div>
              {/* Range tabs */}
              <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1 border border-gray-800/40">
                {["7D", "30D", "3M", "1Y"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                      range === r
                        ? "bg-vault-700 text-gold-400 border border-gold-500/20 shadow-sm"
                        : "text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[280px]">
              <ValueChart />
            </div>
          </motion.div>

          {/* ── Right column — 4 cols ── */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Collection Split */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42, duration: 0.45 }}
              className="rounded-2xl border border-gray-800/40 p-5"
              style={{ background: "rgba(22, 25, 31, 0.55)" }}
            >
              <h3 className="font-display text-sm font-bold text-white tracking-wide mb-4">Collection Split</h3>
              <div className="space-y-3">
                {GAME_DISTRIBUTION.map((game, i) => (
                  <div key={game.abbr}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border font-mono ${GAME_BADGE[game.abbr]}`}>
                          {game.abbr}
                        </span>
                        <span className="text-xs text-gray-400">{game.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-500">{game.count}</span>
                    </div>
                    <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${game.pct}%` }}
                        transition={{ delay: 0.55 + i * 0.1, duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${game.color}cc, ${game.color}88)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vault Log */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52, duration: 0.45 }}
              className="rounded-2xl border border-gray-800/40 p-5 flex flex-col flex-1"
              style={{ background: "rgba(22, 25, 31, 0.55)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  <h3 className="font-display text-sm font-bold text-white tracking-wide">Vault Log</h3>
                </div>
                <button className="text-[9px] text-gray-700 hover:text-gold-400 uppercase tracking-widest transition-colors">
                  View all
                </button>
              </div>

              <div className="space-y-1.5">
                {RECENT_ACTIVITY.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 + i * 0.07 }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-800/20 hover:border-gold-500/15 hover:bg-vault-800/40 transition-all cursor-pointer group"
                  >
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border font-mono shrink-0 ${GAME_BADGE[item.game]}`}>
                      {item.game}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-300 font-medium truncate group-hover:text-white transition-colors">
                        {item.card}
                      </p>
                      <p className="text-[9px] text-gray-700">{item.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono font-bold text-gold-400">
                        ${item.price >= 1000
                          ? (item.price / 1000).toFixed(1) + "k"
                          : item.price.toFixed(0)}
                      </p>
                      {item.type === "up"   && <ArrowUpRight   className="w-3 h-3 text-green-400 ml-auto" />}
                      {item.type === "down" && <ArrowDownRight className="w-3 h-3 text-red-400 ml-auto" />}
                      {item.type === "add"  && <span className="text-[8px] text-blue-400 block">new</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
