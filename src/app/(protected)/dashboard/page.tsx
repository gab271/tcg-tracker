"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownRight, Sparkles, Clock,
  Plus, Zap, Star, TrendingUp,
} from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ValueChart from "@/components/dashboard/ValueChart";
import { useUserStats } from "@/hooks/use-profile";

// Game name → display config mapping
const GAME_CONFIG: Record<string, { abbr: string; color: string; badge: string }> = {
  "Pokémon":              { abbr: "PKM", color: "#ef4444", badge: "bg-red-950/60 text-red-300 border-red-800/50" },
  "Magic: The Gathering": { abbr: "MTG", color: "#3b82f6", badge: "bg-blue-950/60 text-blue-300 border-blue-800/50" },
  "One Piece":            { abbr: "OP",  color: "#eab308", badge: "bg-yellow-950/60 text-yellow-300 border-yellow-800/50" },
  "Yu-Gi-Oh!":            { abbr: "YGO", color: "#a855f7", badge: "bg-purple-950/60 text-purple-300 border-purple-800/50" },
};

const FALLBACK_CONFIG = { abbr: "TCG", color: "#6b7280", badge: "bg-gray-800/60 text-gray-300 border-gray-700/50" };

function getGameConfig(game: string) {
  return GAME_CONFIG[game] ?? FALLBACK_CONFIG;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

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
  const { data: stats, isLoading } = useUserStats();

  useEffect(() => { setMounted(true); }, []);

  const totalValue = stats?.totalValue ?? 0;
  const totalCards = stats?.totalCards ?? 0;
  const topCard = stats?.topCard ?? null;
  const gameDistribution = stats?.gameDistribution ?? [];
  const recentActivity = stats?.recentActivity ?? [];

  // Power level: logarithmic scale, maxes at $50k
  const powerLevel = totalValue > 0
    ? Math.min(100, Math.round((Math.log10(totalValue + 1) / Math.log10(50001)) * 100))
    : 0;

  // Total cards in distribution for percentage calc
  const totalDistCards = gameDistribution.reduce((s, g) => s + g.count, 0);

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {/* ━━━ BATTLEFIELD BACKGROUND ━━━ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#080a0d]" />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 1L55 16v16L28 47 1 32V16Z' fill='none' stroke='%23d4af37' stroke-width='0.6'/%3E%3C/svg%3E")`,
            backgroundSize: "56px 48px",
          }}
        />
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
                {mounted && !isLoading
                  ? <AnimatedCounter prefix="$" value={totalValue} decimals={2} duration={2.5} />
                  : <span className="opacity-40">$0.00</span>}
              </div>
              {/* Energy bar */}
              <div className="mb-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] text-gray-700 uppercase tracking-widest">Power Level</span>
                  <span className="text-[8px] font-mono text-gold-500/60">{powerLevel} / 100</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-gold-900/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${powerLevel}%` }}
                    transition={{ delay: 0.7, duration: 1.4, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3" />
                <span>{gameDistribution.length} game{gameDistribution.length !== 1 ? "s" : ""} tracked</span>
              </div>
            </div>
          </motion.div>

          {/* ── Deck Size / Cards ── */}
          <motion.div
            custom={1} variants={cardAnim} initial="hidden" animate="show"
            className="sm:col-span-1 lg:col-span-2 relative rounded-2xl overflow-hidden p-5 group cursor-default"
            style={{ background: "linear-gradient(135deg, #0e1018 0%, #0f1115 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
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
                {mounted && !isLoading
                  ? <AnimatedCounter value={totalCards} duration={1.5} />
                  : <span className="opacity-40">0</span>}
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-600">
                  {gameDistribution.length} game{gameDistribution.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[10px] text-gray-700">{stats?.deckCount ?? 0} deck{(stats?.deckCount ?? 0) !== 1 ? "s" : ""} built</p>
              </div>
            </div>
          </motion.div>

          {/* ── Crown Jewel ── */}
          <motion.div
            custom={2} variants={cardAnim} initial="hidden" animate="show"
            className="sm:col-span-2 lg:col-span-7 relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between cursor-pointer group"
            style={{
              background: "linear-gradient(145deg, #140e04 0%, #0d1020 50%, #0a0a14 100%)",
              border: "2px solid rgba(212,175,55,0.3)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_60%,rgba(212,175,55,0.13),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_30%,rgba(59,130,246,0.07),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(139,92,246,0.05),transparent_60%)]" />
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
              style={{ animation: "holoshimmer 7s ease-in-out 2s infinite" }}
            >
              <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent" />
            </div>
            <div className="absolute inset-[3px] rounded-xl border border-gold-500/12 pointer-events-none" />

            {topCard ? (
              <>
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
                    <h2 className="font-display text-2xl font-bold text-white leading-tight mb-0.5">{topCard.name}</h2>
                    <p className="text-xs text-gray-500">{topCard.game}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${getGameConfig(topCard.game).badge}`}>
                      {getGameConfig(topCard.game).abbr}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between mt-5 flex-wrap gap-4">
                  <div>
                    <p className="text-[9px] text-gray-700 uppercase tracking-widest mb-1">Market Value</p>
                    <div className="font-display text-4xl font-bold text-white font-mono leading-none">
                      {mounted
                        ? <AnimatedCounter prefix="$" value={topCard.price} decimals={2} duration={2} />
                        : <span className="opacity-40">$0.00</span>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center py-4">
                <Sparkles className="w-8 h-8 text-gold-400/30 mb-3" />
                <p className="text-sm text-gray-600">Your crown jewel will appear here</p>
                <p className="text-xs text-gray-700 mt-1">Add cards to your vault to see your most valuable</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ━━━ BOTTOM GRID ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Value Chart ── */}
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

          {/* ── Right column ── */}
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
              {gameDistribution.length === 0 ? (
                <p className="text-xs text-gray-700 text-center py-4">No cards in vault yet</p>
              ) : (
                <div className="space-y-3">
                  {gameDistribution.map((game, i) => {
                    const cfg = getGameConfig(game.game);
                    const pct = totalDistCards > 0 ? Math.round((game.count / totalDistCards) * 100) : 0;
                    return (
                      <div key={game.game}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border font-mono ${cfg.badge}`}>
                              {cfg.abbr}
                            </span>
                            <span className="text-xs text-gray-400">{game.game}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-gray-500">{game.count}</span>
                        </div>
                        <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.55 + i * 0.1, duration: 0.9, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${cfg.color}cc, ${cfg.color}88)` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

              {recentActivity.length === 0 ? (
                <p className="text-xs text-gray-700 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.map((item, i) => {
                    const cfg = getGameConfig(item.game);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.65 + i * 0.07 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-800/20 hover:border-gold-500/15 hover:bg-vault-800/40 transition-all cursor-pointer group"
                      >
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border font-mono shrink-0 ${cfg.badge}`}>
                          {cfg.abbr}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-300 font-medium truncate group-hover:text-white transition-colors">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-gray-700">{timeAgo(item.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-mono font-bold text-gold-400">
                            {item.price >= 1000
                              ? `$${(item.price / 1000).toFixed(1)}k`
                              : `$${item.price.toFixed(0)}`}
                          </p>
                          <ArrowUpRight className="w-3 h-3 text-blue-400 ml-auto" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
