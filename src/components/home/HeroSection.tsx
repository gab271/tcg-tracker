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
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-vault-900" />
        {/* Diagonal card-back pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              #d4af37 0,
              #d4af37 1px,
              transparent 0,
              transparent 28px
            )`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(212,175,55,0.07)_0%,rgba(15,17,21,1)_70%)]" />
        {/* Ambient game color orbs */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-red-500/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-500/4 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-500/4 rounded-full blur-[70px]" />
      </div>

      <div className="container px-6 lg:px-12 relative z-10 mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: Copy */}
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
            <span className="text-gold-gradient">Tracked. Valued.</span>
            <br />
            <span className="text-white/90">Secured.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 mb-8 leading-relaxed"
          >
            From your first Base Set Charizard to a PSA&nbsp;10 Black Lotus —
            every card deserves a proper home. Track Pokémon, MTG, One Piece
            and Yu-Gi-Oh! all in one vault.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold rounded-sm transition-all duration-300 shadow-[0_0_24px_rgba(212,175,55,0.3)] hover:shadow-[0_0_36px_rgba(212,175,55,0.5)] text-sm uppercase tracking-wider"
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

        {/* Right: Floating TCG Cards */}
        <div className="hidden md:block relative h-[620px] w-full" ref={cardsRef}>

          {/* === Pokémon Charizard — main center card === */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 0.9, delay: 0.2, type: "spring", bounce: 0.25 }}
            whileHover={{ rotate: -2, scale: 1.04, y: -12, transition: { duration: 0.3 } }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[210px] cursor-pointer select-none"
          >
            <div className="rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(239,68,68,0.18)] border-2 border-amber-400/70 bg-gradient-to-b from-amber-950 via-red-950 to-orange-950 p-3 relative">
              {/* Holographic sweep */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                style={{ animation: "holoshimmer 5s ease-in-out 1.5s infinite" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent w-[60%] h-full" />
              </div>
              {/* Inner border */}
              <div className="absolute inset-[4px] rounded-xl border border-amber-600/25 pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="font-display font-bold text-white text-[11px] tracking-wide block">Charizard</span>
                  <span className="text-[8px] text-amber-300/60">Stage 2 · Fire</span>
                </div>
                <span className="text-[11px] text-amber-300 font-bold font-mono">HP 280 🔥</span>
              </div>

              {/* Art */}
              <div className="h-[110px] rounded-lg bg-gradient-to-br from-orange-800/40 via-red-900/30 to-amber-900/20 mb-2.5 relative overflow-hidden flex items-center justify-center border border-amber-700/25">
                <div className="text-[5rem] select-none" style={{ filter: "drop-shadow(0 0 20px rgba(251,146,60,0.4))" }}>🔥</div>
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-yellow-300/5" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-950/60" />
                {/* Price badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-mono font-bold text-amber-300 border border-amber-600/30">
                  PSA 10 · $842
                </div>
              </div>

              {/* Move */}
              <div className="mb-2 pb-2 border-b border-amber-800/35">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white tracking-wider">FIRE SPIN <span className="text-amber-400">✦✦✦</span></span>
                  <span className="text-[11px] font-bold text-amber-300 font-mono">300</span>
                </div>
                <p className="text-[8px] text-gray-500 mt-0.5 leading-tight">Discard 2 🔥 Energy attached to this Pokémon.</p>
              </div>

              {/* Footer */}
              <div className="flex justify-between text-[8px] text-gray-600">
                <span>weakness 💧×2</span>
                <span>retreat ●</span>
              </div>
            </div>
          </motion.div>

          {/* === MTG Black Lotus — back right === */}
          <motion.div
            initial={{ opacity: 0, x: 70, rotate: 14 }}
            animate={{ opacity: 1, x: 0, rotate: 13 }}
            transition={{ duration: 0.9, delay: 0.45, type: "spring" }}
            whileHover={{ rotate: 7, scale: 1.03, transition: { duration: 0.3 } }}
            className="absolute top-[42%] left-[58%] z-20 w-[180px] cursor-pointer select-none"
          >
            <div className="rounded-2xl overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(59,130,246,0.12)] border-2 border-blue-500/35 bg-gradient-to-b from-blue-950 to-indigo-950 p-2.5 opacity-90">
              <div className="absolute inset-[4px] rounded-xl border border-blue-700/20 pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-start mb-1">
                <span className="font-display font-bold text-white text-[10px]">Black Lotus</span>
                <span className="text-[8px] text-gray-400 border border-gray-700 rounded px-1 py-0.5 font-mono">◇ 0</span>
              </div>

              {/* Art */}
              <div className="h-[88px] rounded-md bg-gradient-to-br from-black/80 to-blue-900/30 mb-2 flex items-center justify-center relative overflow-hidden border border-blue-900/40">
                <div className="text-5xl select-none opacity-20">🌸</div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/60" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-blue-300 border border-blue-700/30">
                  LP · $4,200
                </div>
              </div>

              {/* Type line */}
              <div className="text-[8px] text-blue-300/60 mb-1 italic">Artifact</div>

              {/* Rules text */}
              <div className="border-t border-blue-900/40 pt-1.5 text-[8px] text-gray-400 leading-tight">
                ◇, Sacrifice Black Lotus: Add three mana of any one color to your mana pool.
              </div>
            </div>
          </motion.div>

          {/* === Yu-Gi-Oh Dark Magician — back left === */}
          <motion.div
            initial={{ opacity: 0, x: -70, rotate: -22 }}
            animate={{ opacity: 1, x: 0, rotate: -19 }}
            transition={{ duration: 0.9, delay: 0.35, type: "spring" }}
            whileHover={{ rotate: -13, scale: 1.03, transition: { duration: 0.3 } }}
            className="absolute top-[36%] left-[12%] z-10 w-[170px] cursor-pointer select-none"
          >
            <div className="rounded-2xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.75),0_0_30px_rgba(139,92,246,0.12)] border-2 border-yellow-600/35 bg-gradient-to-b from-amber-950 to-yellow-950 p-2.5 opacity-88">
              <div className="absolute inset-[4px] rounded-xl border border-yellow-700/20 pointer-events-none" />

              {/* Header */}
              <div className="mb-0.5">
                <span className="font-display font-bold text-yellow-300/90 text-[10px] block">Dark Magician</span>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-1.5">
                {[...Array(7)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-[8px]">★</span>
                ))}
              </div>

              {/* Art */}
              <div className="h-[84px] rounded-md bg-gradient-to-br from-purple-900/55 to-indigo-950 mb-2 flex items-center justify-center relative overflow-hidden border border-yellow-800/25">
                <div className="text-5xl select-none opacity-22">🧙</div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-950/70" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-yellow-300 border border-yellow-700/30">
                  NM · $380
                </div>
              </div>

              {/* Type */}
              <div className="text-[7.5px] text-gray-400 italic mb-1 border-t border-yellow-800/30 pt-1">
                [ Spellcaster / Normal ]
              </div>

              {/* Stats */}
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-amber-300">ATK/ 2500</span>
                <span className="text-blue-300">DEF/ 2100</span>
              </div>
            </div>
          </motion.div>

          {/* === One Piece Luffy — peeking bottom === */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 0.55, y: 0, rotate: 6 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="absolute bottom-[12%] left-[42%] z-5 w-[155px] cursor-pointer select-none"
          >
            <div className="rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] border border-yellow-500/20 bg-gradient-to-b from-yellow-950/80 to-orange-950/60 p-2.5 overflow-hidden relative h-[110px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-display text-[9px] font-bold text-yellow-200">Monkey D. Luffy</span>
                <span className="text-[8px] text-yellow-500/60 font-mono">OP-01</span>
              </div>
              <div className="text-[8px] text-yellow-300/50 mb-1">Leader · Supernovas</div>
              <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-yellow-950/90 to-transparent" />
              <div className="absolute bottom-2 right-2 text-[8px] font-mono font-bold text-yellow-300/80">
                NM · $1,100
              </div>
            </div>
          </motion.div>

          {/* Floating sparkle dots */}
          {[
            { top: "20%", left: "25%", delay: 0, size: 3 },
            { top: "65%", left: "72%", delay: 0.8, size: 2 },
            { top: "30%", left: "78%", delay: 1.5, size: 2 },
            { top: "80%", left: "30%", delay: 0.4, size: 3 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gold-400"
              style={{
                top: dot.top,
                left: dot.left,
                width: dot.size,
                height: dot.size,
              }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: 2.5, delay: dot.delay, repeat: Infinity }}
            />
          ))}

          {/* Ambient price tag floating */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute top-[14%] right-[8%] z-40"
          >
            <div className="bg-vault-800/90 backdrop-blur-sm border border-gold-500/20 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-xs font-mono font-bold text-green-400">+12.4%</span>
              </div>
              <span className="text-[9px] text-gray-500 block">Portfolio · 30d</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
