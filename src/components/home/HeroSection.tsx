"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import { ChevronRight, TrendingUp, ArrowUpRight } from "lucide-react";

const recentPulls = [
  { user: "dragonmaster_k", card: "Charizard ex SAR", game: "PKM", value: "$842", up: true },
  { user: "lotuskeeper", card: "Black Lotus LP", game: "MTG", value: "$4,200", up: true },
  { user: "pirateking_op", card: "Luffy Manga Rare", game: "OP", value: "$1,100", up: false },
  { user: "shadowrealm99", card: "Dark Magician Alt Art", game: "YGO", value: "$380", up: true },
];

const gameColors: Record<string, string> = {
  PKM: "bg-red-900/50 text-red-300 border-red-800/50",
  MTG: "bg-blue-900/50 text-blue-300 border-blue-800/50",
  OP: "bg-yellow-900/50 text-yellow-300 border-yellow-800/50",
  YGO: "bg-purple-900/50 text-purple-300 border-purple-800/50",
};

const rarityTiers = [
  { symbol: "◆", label: "Common", col: "text-gray-400 border-gray-700/60" },
  { symbol: "◆◆", label: "Uncommon", col: "text-emerald-400 border-emerald-800/50" },
  { symbol: "★", label: "Rare", col: "text-blue-400 border-blue-700/50" },
  { symbol: "★★", label: "Ultra Rare", col: "text-yellow-400 border-yellow-700/50" },
  { symbol: "★★★", label: "Secret", col: "text-gold-400 border-gold-500/50 bg-gold-500/5", glow: true },
];

const energyParticles = [
  { symbol: "⚡", color: "#facc15", top: "14%", left: "7%", delay: 0,   dur: 4.5 },
  { symbol: "✦",  color: "#60a5fa", top: "26%", left: "93%", delay: 0.6, dur: 5.2 },
  { symbol: "★",  color: "#c084fc", top: "72%", left: "4%",  delay: 1.1, dur: 4.8 },
  { symbol: "☠",  color: "#fbbf24", top: "82%", left: "89%", delay: 1.6, dur: 5.0 },
  { symbol: "◆",  color: "#d4af37", top: "55%", left: "96%", delay: 0.9, dur: 4.2 },
  { symbol: "✦",  color: "#34d399", top: "40%", left: "2%",  delay: 2.0, dur: 5.5 },
  { symbol: "⚡", color: "#f87171", top: "88%", left: "48%", delay: 1.3, dur: 4.0 },
  { symbol: "★",  color: "#d4af37", top: "10%", left: "58%", delay: 0.4, dur: 4.7 },
];

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || !cardsRef.current) return;
    const handleMouseMove = (e: MouseEvent) => {
      const xPos = (e.clientX / window.innerWidth - 0.5) * 18;
      const yPos = (e.clientY / window.innerHeight - 0.5) * 12;
      gsap.to(cardsRef.current, { x: xPos, y: yPos, duration: 1.4, ease: "power2.out" });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center py-24 overflow-hidden"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-vault-900" />
        {/* Diagonal card-back diamond grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(-45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 28px),
              repeating-linear-gradient( 45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 28px)
            `,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(212,132,26,0.09)_0%,rgba(6,8,14,1)_68%)]" />
        {/* Game colour orbs */}
        <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-red-500/5  rounded-full blur-[110px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80  h-80  bg-blue-500/5  rounded-full blur-[85px]" />
        <div className="absolute top-1/2  right-1/4 w-72  h-72  bg-purple-500/5 rounded-full blur-[75px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64  h-64  bg-yellow-500/4 rounded-full blur-[85px]" />
      </div>

      {/* ── Floating energy symbols ── */}
      {energyParticles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none select-none z-[1] text-base font-bold"
          style={{ top: p.top, left: p.left, color: p.color }}
          animate={{ y: [0, -14, 0], opacity: [0.2, 0.55, 0.2], rotate: [0, 12, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {p.symbol}
        </motion.div>
      ))}

      <div className="container px-6 lg:px-12 relative z-10 mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* ── Left: Copy ── */}
        <div className="max-w-xl">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border border-gold-500/25 bg-gold-500/5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gold-400 text-xs font-semibold tracking-[0.15em] uppercase">
              12,400+ collectors tracking live
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.12] mb-5 text-white"
          >
            Your rarest pulls.<br />
            <span className="text-gold-gradient">Tracked. Valued.</span><br />
            <span className="text-white/90">Secured.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 mb-6 leading-relaxed"
          >
            From your first Base Set Charizard to a PSA&nbsp;10 Black Lotus —
            every card deserves a proper home. Track Pokémon, MTG, One Piece
            and Yu-Gi-Oh! all in one vault.
          </motion.p>

          {/* Rarity tier indicators */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.27 }}
            className="flex items-center gap-2 mb-8"
          >
            {rarityTiers.map((r, i) => (
              <div
                key={i}
                className={`text-center px-2 py-1 rounded border text-[8px] font-bold ${r.col} transition-all duration-300 hover:scale-110`}
                style={r.glow ? { animation: "rarityPulse 2.5s ease-in-out infinite" } : undefined}
              >
                <div className="text-[10px] mb-0.5">{r.symbol}</div>
                <div className="opacity-60 whitespace-nowrap">{r.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.33 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-fire-500 hover:bg-fire-400 text-white font-bold rounded-sm transition-all duration-300 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] text-sm uppercase tracking-wider"
            >
              Start for free
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/market"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-gray-700/80 hover:border-gray-500 text-gray-400 hover:text-white font-medium rounded-sm transition-all duration-300 text-sm"
            >
              Browse Market
            </Link>
          </motion.div>

          {/* Recent pulls feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="border-t border-gray-800/70 pt-5"
          >
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-3 font-semibold">
              Recent vault additions
            </p>
            <div className="space-y-0">
              {recentPulls.map((pull, i) => (
                <motion.div
                  key={pull.card}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.12 }}
                  className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono shrink-0 ${gameColors[pull.game]}`}>
                      {pull.game}
                    </span>
                    <span className="text-sm text-gray-300 truncate">{pull.card}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <TrendingUp className={`w-3 h-3 ${pull.up ? "text-green-400" : "text-red-400"}`} />
                    <span className="text-sm font-mono font-bold text-gold-400">{pull.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right: Floating TCG Cards ── */}
        <div className="hidden md:block relative h-[640px] w-full" ref={cardsRef}>

          {/* ═══════════════════════════════════════
              POKÉMON Charizard ex — FULL ART SECRET RARE
          ═══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 0.9, delay: 0.2, type: "spring", bounce: 0.25 }}
            whileHover={{ rotate: -1.5, scale: 1.05, y: -14, transition: { duration: 0.3 } }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[218px] cursor-pointer select-none"
          >
            {/* Outer glow aura — secret rare */}
            <div
              className="absolute -inset-4 rounded-3xl blur-xl opacity-50 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(251,191,36,0.4) 0%, rgba(239,68,68,0.18) 55%, transparent 80%)" }}
            />

            <div
              className="relative rounded-[14px] overflow-hidden border-[3px] border-amber-400/90 p-[5px]"
              style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.92), 0 0 65px rgba(251,146,60,0.22), inset 0 1px 0 rgba(255,255,255,0.12)" }}
            >
              {/* ── Rainbow Holographic Foil Overlay ── */}
              <div
                className="absolute inset-0 rounded-[12px] z-20 pointer-events-none mix-blend-overlay"
                style={{
                  background: "linear-gradient(125deg, hsla(0,100%,65%,0.13) 0%, hsla(60,100%,65%,0.13) 16%, hsla(120,100%,65%,0.13) 33%, hsla(180,100%,65%,0.13) 50%, hsla(240,100%,65%,0.13) 67%, hsla(300,100%,65%,0.13) 84%, hsla(360,100%,65%,0.13) 100%)",
                  backgroundSize: "300% 300%",
                  animation: "holorainbow 5s ease infinite",
                }}
              />
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 rounded-[12px] z-21 pointer-events-none overflow-hidden"
                style={{ animation: "holoshimmer 5s ease-in-out 1.5s infinite" }}
              >
                <div
                  className="absolute inset-0 w-[55%] h-full"
                  style={{ background: "linear-gradient(105deg, transparent 10%, rgba(255,255,255,0.14) 50%, transparent 90%)" }}
                />
              </div>

              {/* Card frame inner */}
              <div className="rounded-[10px] overflow-hidden bg-gradient-to-b from-[#3d1a00] via-[#5c1a0a] to-[#2a0e00]">

                {/* Header */}
                <div className="px-3 pt-2.5 pb-1.5 flex justify-between items-start bg-gradient-to-r from-amber-900/60 to-red-900/40">
                  <div>
                    <div className="font-display font-bold text-white text-[12px] tracking-wide">Charizard ex</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7.5px] text-amber-300/60 font-mono">Stage 2</span>
                      <span className="text-[7px] text-amber-300/30">·</span>
                      <span className="inline-flex items-center gap-0.5 text-[7.5px] text-orange-300/60">
                        <span className="w-[9px] h-[9px] rounded-full bg-red-500/70 border border-red-400/50 inline-flex items-center justify-center text-[5px]">🔥</span>
                        Fire
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-amber-200 font-bold font-mono leading-none">
                      HP <span className="text-[15px] text-white">280</span>
                    </div>
                    <div className="text-[7px] text-red-400/70 text-right mt-0.5">🔥</div>
                  </div>
                </div>

                {/* Art zone */}
                <div
                  className="mx-2.5 h-[118px] rounded-lg mb-2.5 relative overflow-hidden border border-amber-700/30"
                  style={{
                    background: "radial-gradient(ellipse at 35% 35%, rgba(251,146,60,0.35) 0%, rgba(194,65,12,0.45) 45%, rgba(90,20,5,0.7) 100%)",
                  }}
                >
                  {/* Grid overlay for full-art feel */}
                  <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                  <div className="flex items-center justify-center h-full">
                    <div
                      className="text-[5.8rem] select-none"
                      style={{ filter: "drop-shadow(0 0 28px rgba(251,146,60,0.7)) drop-shadow(0 0 10px rgba(239,68,68,0.5))" }}
                    >
                      🔥
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#2a0e00]/60" />
                  {/* PSA badge */}
                  <div className="absolute top-2 left-2 bg-[#002b5c]/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-white border border-blue-400/50 font-mono">
                    PSA 10
                  </div>
                  {/* Price badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono font-bold text-amber-300 border border-amber-600/40">
                    $842
                  </div>
                </div>

                {/* Attack */}
                <div className="mx-2.5 mb-2 pb-2 border-b border-amber-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, j) => (
                        <span
                          key={j}
                          className="w-[10px] h-[10px] rounded-full bg-red-500/75 border border-red-400/60 inline-block"
                        />
                      ))}
                      <span className="text-[8.5px] font-bold text-white ml-1.5 tracking-wider">FIRE SPIN</span>
                    </div>
                    <span className="text-[14px] font-bold text-amber-300 font-mono leading-none">300</span>
                  </div>
                  <p className="text-[7.5px] text-gray-500 leading-tight">
                    Discard 2 🔥 Energy attached to this Pokémon.
                  </p>
                </div>

                {/* Weakness / Resistance / Retreat */}
                <div className="mx-2.5 pb-1.5 grid grid-cols-3 text-[7px] text-gray-600">
                  <span>weakness&nbsp;<span className="text-blue-400">💧×2</span></span>
                  <span className="text-center">resist&nbsp;<span className="text-gray-700">—</span></span>
                  <span className="text-right">
                    retreat&nbsp;
                    {[...Array(2)].map((_, j) => (
                      <span key={j} className="w-[7px] h-[7px] rounded-full bg-gray-600 inline-block ml-0.5" />
                    ))}
                  </span>
                </div>

                {/* Card number + rarity */}
                <div className="mx-2.5 pb-2 flex justify-between items-center">
                  <span className="text-[6.5px] text-gray-700 font-mono">001/100</span>
                  <span className="text-[9px] text-gold-400/90 tracking-wide">★★★</span>
                  <span className="text-[6.5px] text-gray-700 font-mono">SVP-EN</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════
              MTG Black Lotus — ALPHA BLACK BORDER
          ═══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 70, rotate: 14 }}
            animate={{ opacity: 1, x: 0, rotate: 13 }}
            transition={{ duration: 0.9, delay: 0.45, type: "spring" }}
            whileHover={{ rotate: 7, scale: 1.04, y: -8, transition: { duration: 0.3 } }}
            className="absolute top-[41%] left-[57%] z-20 w-[185px] cursor-pointer select-none"
          >
            <div
              className="rounded-xl overflow-hidden border-[2.5px] border-gray-900 bg-[#080810] opacity-93 relative"
              style={{ boxShadow: "0 22px 58px rgba(0,0,0,0.9), 0 0 32px rgba(59,130,246,0.1)" }}
            >
              {/* MTG title bar */}
              <div className="bg-gradient-to-r from-[#0a0f1a] via-[#0e1428] to-[#0a0f1a] px-2.5 py-1.5 border-b border-gray-800/70">
                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-white text-[10.5px] tracking-wide">Black Lotus</span>
                  <span className="text-[8.5px] font-mono border border-gray-700 rounded px-1 py-0.5 text-gray-400">◇ 0</span>
                </div>
              </div>

              {/* Art zone */}
              <div
                className="h-[94px] relative overflow-hidden flex items-center justify-center border-b border-gray-800/50"
                style={{ background: "radial-gradient(ellipse at center, #0d1a2e 0%, #020408 100%)" }}
              >
                <div
                  className="text-[4.8rem] select-none"
                  style={{ filter: "drop-shadow(0 0 18px rgba(59,130,246,0.35))", opacity: 0.3 }}
                >
                  🌸
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                <div className="absolute bottom-2 right-2 bg-black/85 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold text-blue-300 border border-blue-700/40">
                  $4,200
                </div>
              </div>

              {/* Type line */}
              <div className="px-2.5 py-1 border-b border-gray-800/40 bg-[#0a0d1a]/80 flex justify-between items-center">
                <span className="text-[8px] text-blue-300/55 italic">Artifact</span>
                <span className="text-[7.5px] text-gray-600">A · LP</span>
              </div>

              {/* Rules text box */}
              <div className="px-2.5 py-2 bg-[#07080f]">
                <div className="border border-gray-800/60 rounded p-1.5 bg-gray-950/50">
                  <p className="text-[7.5px] text-gray-400 leading-[1.5] italic">
                    ◇, Sacrifice Black Lotus: Add three mana of any one color to your mana pool.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-2.5 pb-2 flex justify-between items-center">
                <span className="text-[6px] text-gray-700 font-mono">© 1993 Wizards · Alpha · 25</span>
                <span className="text-[6px] text-gray-700">C. Shuler</span>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════
              YU-GI-OH Dark Magician — ULTRA RARE 1st ED
          ═══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -70, rotate: -22 }}
            animate={{ opacity: 1, x: 0, rotate: -19 }}
            transition={{ duration: 0.9, delay: 0.35, type: "spring" }}
            whileHover={{ rotate: -13, scale: 1.04, y: -8, transition: { duration: 0.3 } }}
            className="absolute top-[33%] left-[9%] z-10 w-[175px] cursor-pointer select-none"
          >
            {/* Ultra rare glow */}
            <div
              className="absolute -inset-2 rounded-2xl blur-lg opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, transparent 70%)" }}
            />
            <div
              className="rounded-xl overflow-hidden border-[2.5px] border-yellow-600/65 bg-gradient-to-b from-[#2a1800] to-[#0e0a00] opacity-92 relative"
              style={{ boxShadow: "0 18px 50px rgba(0,0,0,0.85), 0 0 28px rgba(168,85,247,0.12)" }}
            >
              {/* Header */}
              <div className="px-2.5 pt-2 pb-1 bg-gradient-to-r from-amber-950/80 to-yellow-950/50 border-b border-yellow-800/30">
                <div className="flex justify-between items-start">
                  <span className="font-display font-bold text-yellow-300/95 text-[10.5px] tracking-wide">Dark Magician</span>
                  <div className="flex gap-px ml-1">
                    {[...Array(7)].map((_, i) => (
                      <span key={i} className="text-yellow-400" style={{ fontSize: "8px" }}>★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Art zone */}
              <div
                className="mx-2 mt-1.5 h-[90px] rounded-sm mb-2 relative overflow-hidden border border-yellow-800/35"
                style={{
                  background: "radial-gradient(ellipse at 40% 35%, rgba(139,92,246,0.45) 0%, rgba(60,25,100,0.75) 55%, rgba(14,8,32,0.95) 100%)",
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <div
                    className="text-[4.5rem] select-none"
                    style={{ filter: "drop-shadow(0 0 20px rgba(168,85,247,0.55))", opacity: 0.55 }}
                  >
                    🧙
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e0a00]/65" />
                <div className="absolute top-1.5 left-1.5 bg-purple-950/90 px-1 py-0.5 rounded text-[6.5px] font-bold text-purple-200 border border-purple-500/35 font-mono">
                  ULTRA RARE
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-yellow-300 border border-yellow-700/35">
                  $380
                </div>
              </div>

              {/* Type bar */}
              <div className="mx-2 mb-1.5 border border-yellow-800/40 rounded-sm px-1.5 py-0.5 bg-amber-950/50">
                <span className="text-[7.5px] text-gray-400 italic">[ Dark / Spellcaster / Normal ]</span>
              </div>

              {/* Empty effect text zone */}
              <div className="mx-2 mb-1.5 p-1.5 bg-[#1a1000]/60 border border-amber-900/30 rounded-sm min-h-[18px]" />

              {/* ATK / DEF */}
              <div className="mx-2 mb-1.5 flex justify-between border-t border-yellow-800/25 pt-1.5">
                <span className="text-[10px] font-bold text-amber-300 font-mono">ATK/ 2500</span>
                <span className="text-[10px] font-bold text-blue-300 font-mono">DEF/ 2100</span>
              </div>

              {/* Card number */}
              <div className="mx-2 mb-1.5 flex justify-between">
                <span className="text-[6px] text-gray-700 font-mono">MAGO-EN201 ①</span>
                <span className="text-[6px] text-gray-700">1st Edition</span>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════
              ONE PIECE Luffy — MANGA RARE (peeking)
          ═══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 0.65, y: 0, rotate: 6 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="absolute bottom-[9%] left-[42%] z-5 w-[160px] cursor-pointer select-none"
          >
            <div
              className="rounded-xl overflow-hidden border-2 border-yellow-500/40 relative h-[118px] bg-gradient-to-b from-red-950 via-red-900/80 to-yellow-950"
              style={{ boxShadow: "0 10px 32px rgba(0,0,0,0.75)" }}
            >
              {/* Header bar */}
              <div className="px-2 py-1.5 bg-red-800/50 border-b border-yellow-600/20 flex justify-between items-start">
                <div>
                  <span className="text-[9.5px] font-bold text-yellow-100 block font-display">Monkey D. Luffy</span>
                  <span className="text-[7px] text-yellow-400/65">Leader · Supernovas</span>
                </div>
                <span className="text-[7px] text-yellow-500/50 font-mono">OP-01</span>
              </div>

              {/* Cost pips */}
              <div className="px-2 pt-1.5 flex items-center gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="w-[11px] h-[11px] rounded-full bg-red-500/65 border border-red-400/35 inline-block" />
                ))}
                <span className="text-[7px] text-red-300/55 ml-1 font-mono">Cost 5</span>
              </div>

              <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-yellow-950/90 to-transparent" />
              <div className="absolute bottom-2 right-2 text-[8.5px] font-mono font-bold text-yellow-300/85">
                NM · $1,100
              </div>
              <div className="absolute bottom-2 left-2 text-[7px] text-yellow-500/45 font-mono">
                PWR: 5000
              </div>
            </div>
          </motion.div>

          {/* Sparkle dots */}
          {[
            { top: "20%", left: "25%", delay: 0,   size: 3 },
            { top: "65%", left: "73%", delay: 0.8, size: 2 },
            { top: "30%", left: "79%", delay: 1.5, size: 2 },
            { top: "80%", left: "30%", delay: 0.4, size: 3 },
            { top: "50%", left: "89%", delay: 1.2, size: 2 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gold-400"
              style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
              animate={{ opacity: [0.2, 0.95, 0.2], scale: [1, 1.9, 1] }}
              transition={{ duration: 2.5, delay: dot.delay, repeat: Infinity }}
            />
          ))}

          {/* Portfolio badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute top-[13%] right-[7%] z-40"
          >
            <div className="bg-vault-800/90 backdrop-blur-sm border border-gold-500/20 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-xs font-mono font-bold text-green-400">+12.4%</span>
              </div>
              <span className="text-[9px] text-gray-500 block">Portfolio · 30d</span>
            </div>
          </motion.div>

          {/* PSA grade badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-[23%] left-[4%] z-40"
          >
            <div className="bg-[#002b5c]/85 backdrop-blur-sm border border-blue-500/35 rounded-lg px-3 py-2 shadow-lg">
              <div className="text-[9px] font-bold text-white font-mono">PSA 10</div>
              <div className="text-[8px] text-blue-400 font-mono">GEM MINT</div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
