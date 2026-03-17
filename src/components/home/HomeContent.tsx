'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, Star, Check, Layers, BarChart3, Repeat2, Bell } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Scrolling ticker data
const tickerItems = [
  { name: "Charizard ex SAR", game: "PKM", price: "$842", change: "+4.2%", up: true },
  { name: "Black Lotus Alpha", game: "MTG", price: "$4,200", change: "+1.8%", up: true },
  { name: "Luffy Manga Rare", game: "OP", price: "$1,100", change: "-2.1%", up: false },
  { name: "Pikachu Illustrator", game: "PKM", price: "$9,100", change: "+7.5%", up: true },
  { name: "Dark Magician Alt Art", game: "YGO", price: "$380", change: "+3.3%", up: true },
  { name: "Mox Sapphire", game: "MTG", price: "$1,850", change: "-0.9%", up: false },
  { name: "Umbreon VMAX EA", game: "PKM", price: "$620", change: "+2.7%", up: true },
  { name: "Nami Secret Rare", game: "OP", price: "$290", change: "+5.1%", up: true },
  { name: "Blue-Eyes White Dragon", game: "YGO", price: "$480", change: "-1.4%", up: false },
  { name: "Force of Will", game: "MTG", price: "$120", change: "+0.6%", up: true },
];

const gameColors: Record<string, string> = {
  PKM: "text-red-400",
  MTG: "text-blue-400",
  OP: "text-yellow-400",
  YGO: "text-purple-400",
};

const games = [
  {
    name: "Pokémon TCG",
    count: "450K+",
    color: "#ef4444",
    bg: "from-red-950 to-red-900/20",
    border: "border-red-700/50",
    glow: "rgba(239,68,68,0.22)",
    symbol: "⚡",
    desc: "Base Set through Scarlet & Violet",
    energyColor: "#ef4444",
    energyPips: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
    statLabel: "HP",
    statVal: "450",
    cardType: "Stage 2",
    cardFrame: "border-[3px] border-yellow-500/60",
    innerBg: "from-red-950/90 via-red-900/40 to-black",
    mechanic: "Energy Attach",
    icon: "🔥",
  },
  {
    name: "Magic: The Gathering",
    count: "890K+",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900/20",
    border: "border-blue-700/50",
    glow: "rgba(59,130,246,0.22)",
    symbol: "✦",
    desc: "Alpha through The Lost Caverns",
    energyColor: "#3b82f6",
    energyPips: ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"],
    statLabel: "CMC",
    statVal: "0–16",
    cardType: "Sorcery · Instant · Artifact",
    cardFrame: "border-[2.5px] border-gray-800",
    innerBg: "from-[#0a0f1a] via-blue-950/30 to-black",
    mechanic: "Stack Resolution",
    icon: "✦",
  },
  {
    name: "One Piece TCG",
    count: "120K+",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900/20",
    border: "border-yellow-700/50",
    glow: "rgba(234,179,8,0.22)",
    symbol: "☠",
    desc: "Romance Dawn through Wings of Captain",
    energyColor: "#eab308",
    energyPips: ["#ef4444", "#eab308", "#3b82f6", "#10b981", "#8b5cf6"],
    statLabel: "PWR",
    statVal: "5K+",
    cardType: "Leader · Character",
    cardFrame: "border-[2.5px] border-yellow-500/55",
    innerBg: "from-red-950/90 via-yellow-950/30 to-black",
    mechanic: "Rush · Blocker",
    icon: "☠",
  },
  {
    name: "Yu-Gi-Oh!",
    count: "340K+",
    color: "#a855f7",
    bg: "from-purple-950 to-purple-900/20",
    border: "border-yellow-600/50",
    glow: "rgba(168,85,247,0.22)",
    symbol: "★",
    desc: "LOB through Rage of the Abyss",
    energyColor: "#a855f7",
    energyPips: ["#fbbf24", "#f59e0b", "#d97706"],
    statLabel: "ATK",
    statVal: "4000",
    cardType: "Monster · Spell · Trap",
    cardFrame: "border-[2.5px] border-yellow-600/55",
    innerBg: "from-amber-950/90 via-purple-950/20 to-black",
    mechanic: "Summon · Activate",
    icon: "🧙",
  },
];

const steps = [
  {
    number: "01",
    title: "Add Your Cards",
    desc: "Search by name, set, or number. Add condition, grade, and purchase price. Build your binder in minutes.",
    icon: Layers,
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
  },
  {
    number: "02",
    title: "Track the Market",
    desc: "Watch real-time charts. Get alerts when your grails spike. Never miss a sell window again.",
    icon: BarChart3,
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  {
    number: "03",
    title: "Trade & Grow",
    desc: "Connect with verified collectors. Make offers, negotiate trades, and close deals safely.",
    icon: Repeat2,
    color: "text-green-400",
    bg: "bg-green-500/8",
    border: "border-green-500/20",
  },
];

export default function HomeContent() {
  const statsRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    countersRef.current.forEach((el, index) => {
      if (!el) return;
      const targetStr = el.dataset.target || '0';
      const isFloat = targetStr.includes('.');
      const targetVal = parseFloat(targetStr);
      const obj = { val: 0 };

      gsap.to(obj, {
        val: targetVal,
        duration: 2.5,
        ease: 'power3.out',
        delay: index * 0.2,
        scrollTrigger: { trigger: statsRef.current, start: 'top 85%' },
        onUpdate: () => {
          if (el) {
            el.innerHTML = isFloat
              ? obj.val.toFixed(1)
              : Math.round(obj.val).toLocaleString('en-US');
          }
        },
      });
    });

    featuresRef.current.forEach((feature, index) => {
      if (feature) {
        gsap.fromTo(
          feature,
          { opacity: 0, x: index % 2 === 0 ? -80 : 80 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: feature, start: 'top 80%' },
          }
        );
      }
    });
  }, []);

  return (
    <div className="bg-vault-900 text-white overflow-hidden">

      {/* ── LIVE PRICE TICKER ── */}
      <div className="w-full border-y border-gold-500/15 bg-vault-800/60 py-2.5 overflow-hidden relative">
        <div className="flex items-center gap-6" style={{ animation: 'ticker 38s linear infinite', width: 'max-content' }}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0 px-3">
              <span className={`text-[10px] font-bold font-mono ${gameColors[item.game]}`}>{item.game}</span>
              <span className="text-sm text-gray-200 font-medium">{item.name}</span>
              <span className="text-sm font-mono font-bold text-gold-400">{item.price}</span>
              <span className={`flex items-center gap-0.5 text-xs font-bold ${item.up ? 'text-green-400' : 'text-red-400'}`}>
                {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.change}
              </span>
              <span className="text-gray-700 text-xs">·</span>
            </div>
          ))}
        </div>
        {/* Fade masks */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-vault-800/80 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-vault-800/80 to-transparent pointer-events-none" />
      </div>

      {/* ── RARITY TIERS SHOWCASE ── */}
      <section className="py-16 bg-vault-900 border-b border-gold-500/8">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-gold-500/60 text-[10px] uppercase tracking-[0.25em] font-semibold mb-2">Collection Hierarchy</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Every Rarity. Every Game.</h2>
            <p className="text-gray-400 text-sm mt-2">From bulk commons to PSA-graded secret rares — we track them all</p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-end gap-4 lg:gap-6">
            {[
              {
                symbol: "◆", name: "Common", abbr: "C",
                border: "border-gray-700/60", bg: "from-gray-900 to-gray-950",
                textCol: "text-gray-400", glowCol: "rgba(156,163,175,0.12)",
                holo: false, height: "h-28", icon: "🃏", price: "$0.10",
              },
              {
                symbol: "◆◆", name: "Uncommon", abbr: "U",
                border: "border-emerald-700/50", bg: "from-emerald-950 to-gray-950",
                textCol: "text-emerald-400", glowCol: "rgba(52,211,153,0.15)",
                holo: false, height: "h-32", icon: "🌿", price: "$1–5",
              },
              {
                symbol: "★", name: "Rare", abbr: "R",
                border: "border-blue-600/50", bg: "from-blue-950 to-gray-950",
                textCol: "text-blue-400", glowCol: "rgba(96,165,250,0.2)",
                holo: false, height: "h-36", icon: "💎", price: "$5–50",
              },
              {
                symbol: "★★", name: "Ultra Rare", abbr: "UR",
                border: "border-yellow-500/60", bg: "from-yellow-950 to-amber-950",
                textCol: "text-yellow-400", glowCol: "rgba(251,191,36,0.25)",
                holo: true, holoColors: "hsla(40,100%,65%,0.14)", height: "h-40", icon: "✨", price: "$50–500",
              },
              {
                symbol: "★★★", name: "Secret Rare", abbr: "SR",
                border: "border-gold-500/70", bg: "from-amber-900 to-orange-950",
                textCol: "text-gold-400", glowCol: "rgba(212,175,55,0.4)",
                holo: true, holoColors: "125deg,hsla(0,100%,65%,0.13) 0%,hsla(60,100%,65%,0.13) 20%,hsla(120,100%,65%,0.13) 40%,hsla(180,100%,65%,0.13) 60%,hsla(240,100%,65%,0.13) 80%,hsla(300,100%,65%,0.13) 100%",
                rainbow: true, height: "h-48", icon: "🏆", price: "$500+",
              },
            ].map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -10, scale: 1.06, transition: { duration: 0.25 } }}
                className={`relative w-[88px] lg:w-[100px] ${tier.height} rounded-xl border-2 ${tier.border} overflow-hidden cursor-pointer flex-shrink-0`}
                style={{ boxShadow: `0 8px 32px ${tier.glowCol}, 0 0 0 1px rgba(255,255,255,0.03)` }}
              >
                {/* Holographic overlay */}
                {tier.holo && (
                  <div
                    className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
                    style={tier.rainbow ? {
                      background: `linear-gradient(${tier.holoColors})`,
                      backgroundSize: "300% 300%",
                      animation: "holorainbow 4s ease infinite",
                    } : {
                      background: `linear-gradient(135deg, transparent 30%, ${tier.holoColors} 50%, transparent 70%)`,
                      animation: "holoshimmer 3.5s ease-in-out 0.5s infinite",
                      backgroundSize: "200% 100%",
                    }}
                  />
                )}

                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-b ${tier.bg}`} />

                {/* Content */}
                <div className="relative z-20 h-full flex flex-col items-center justify-between p-2 pt-2.5">
                  <div className={`text-[10px] font-bold font-mono ${tier.textCol}`}>{tier.abbr}</div>
                  <div className="text-3xl">{tier.icon}</div>
                  <div className="text-center">
                    <div className={`text-[9px] font-bold ${tier.textCol} tracking-wide`}>{tier.symbol}</div>
                    <div className="text-[7.5px] text-gray-500 mt-0.5">{tier.name}</div>
                    <div className={`text-[7px] font-mono font-bold ${tier.textCol} mt-1 opacity-70`}>{tier.price}</div>
                  </div>
                </div>

                {/* Secret rare outer glow */}
                {tier.rainbow && (
                  <div
                    className="absolute -inset-1 rounded-xl blur-md -z-10"
                    style={{ background: "radial-gradient(ellipse, rgba(212,175,55,0.3) 0%, transparent 70%)", animation: "rarityPulse 2s ease-in-out infinite" }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Connector arrows between cards */}
          <div className="hidden lg:flex items-center justify-center gap-0 mt-4 pointer-events-none select-none">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center" style={{ width: "calc((100% - 5 * 100px) / 4 + 100px)", justifyContent: "flex-end" }}>
                <span className="text-gray-700 text-lg mr-1">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section ref={statsRef} className="w-full border-b border-gold-500/10 py-16 bg-vault-900">
        <div className="max-w-5xl mx-auto px-6">
          {/* TCG stat block style header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-gold-500/20 rounded-full bg-gold-500/5">
              <span className="text-[8px] font-bold text-gold-400/60 uppercase tracking-[0.2em]">Vault Stats</span>
              <span className="w-px h-3 bg-gold-500/20" />
              <div className="flex gap-1">
                {["⚡","✦","★","☠"].map((s, j) => (
                  <span key={j} className="text-[10px] opacity-40">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: "12400", suffix: "+", label: "Collectors worldwide", prefix: "", symbol: "⚡", symbolCol: "text-yellow-400", border: "border-yellow-700/25", bg: "bg-yellow-500/3" },
              { value: "2.3", suffix: "M", label: "Total value tracked", prefix: "€", symbol: "◆", symbolCol: "text-gold-400", border: "border-gold-500/30", bg: "bg-gold-500/4" },
              { value: "847", suffix: "K+", label: "Cards registered", prefix: "", symbol: "★", symbolCol: "text-blue-400", border: "border-blue-700/25", bg: "bg-blue-500/3" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`relative py-8 px-6 text-center rounded-xl border ${stat.border} ${stat.bg} overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
              >
                {/* Background stat symbol */}
                <div className={`absolute top-3 right-4 text-5xl font-bold ${stat.symbolCol} opacity-[0.06] select-none pointer-events-none`}>
                  {stat.symbol}
                </div>
                <div className={`text-xs font-bold ${stat.symbolCol} opacity-50 uppercase tracking-[0.2em] mb-3 font-mono`}>
                  {stat.symbol} {stat.label}
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold text-gold-500 font-mono leading-none">
                  {stat.prefix}
                  <span ref={el => { countersRef.current[i] = el; }} data-target={stat.value}>0</span>
                  {stat.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-gradient-to-b from-vault-900 to-vault-800/40">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-gold-500/70 text-xs uppercase tracking-[0.25em] font-semibold mb-3">Simple by design</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-0">
              Your Vault in 3 Steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-14 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.25 } }}
                className={`relative rounded-xl border-2 ${step.border} overflow-hidden group cursor-pointer`}
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)" }}
              >
                {/* Card frame header */}
                <div className={`px-5 pt-5 pb-3 border-b ${step.border} flex justify-between items-center ${step.bg}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.bg} border ${step.border}`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className={`font-display font-bold text-3xl ${step.color} opacity-20 group-hover:opacity-40 transition-opacity font-mono`}>
                    {step.number}
                  </span>
                </div>

                {/* Art zone */}
                <div className={`mx-4 my-3 h-[72px] rounded-lg ${step.bg} border ${step.border} flex items-center justify-center relative overflow-hidden`}>
                  <step.icon className={`w-10 h-10 ${step.color} opacity-15`} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                </div>

                {/* Type line */}
                <div className="mx-4 mb-3">
                  <div className={`border ${step.border} rounded-sm px-2 py-0.5`}>
                    <span className={`text-[7.5px] italic ${step.color} opacity-60`}>Trainer Card · Tool</span>
                  </div>
                </div>

                {/* Rules text / body */}
                <div className="mx-4 mb-4 px-3 py-3 bg-black/20 border border-white/5 rounded-lg min-h-[72px]">
                  <h3 className="font-display text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-xs">{step.desc}</p>
                </div>

                {/* Card number footer */}
                <div className="mx-4 mb-4 flex justify-between items-center">
                  <span className={`text-[7px] font-mono ${step.color} opacity-30`}>TCG-TRK-0{i + 1}/03</span>
                  <span className={`text-[8px] font-bold ${step.color} opacity-50`}>★</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-vault-900 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 space-y-28">

          {/* Feature 1: Collection View */}
          <div ref={el => { featuresRef.current[0] = el; }} className="flex flex-col md:flex-row items-center gap-14">
            {/* CSS Mockup: Collection grid */}
            <div className="w-full md:w-1/2 aspect-video rounded-2xl border border-gold-500/15 bg-vault-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group hover:border-gold-500/35 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-vault-700/40 to-transparent" />
              {/* Fake navbar */}
              <div className="relative px-4 py-3 border-b border-gray-800/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="text-[9px] text-gray-600 ml-2 font-mono">vault.tcgtracker.app/collection</span>
              </div>
              {/* Fake card grid */}
              <div className="relative p-4 grid grid-cols-4 gap-2">
                {[
                  { color: "from-red-900/60 to-orange-900/40", label: "PKM", glow: "rgba(239,68,68,0.25)" },
                  { color: "from-blue-900/60 to-indigo-900/40", label: "MTG", glow: "rgba(59,130,246,0.25)" },
                  { color: "from-purple-900/60 to-violet-900/40", label: "YGO", glow: "rgba(168,85,247,0.25)" },
                  { color: "from-yellow-900/60 to-amber-900/40", label: "OP", glow: "rgba(234,179,8,0.25)" },
                  { color: "from-orange-900/60 to-red-900/40", label: "PKM", glow: "rgba(251,146,60,0.25)" },
                  { color: "from-cyan-900/60 to-blue-900/40", label: "MTG", glow: "rgba(6,182,212,0.25)" },
                  { color: "from-indigo-900/60 to-purple-900/40", label: "YGO", glow: "rgba(129,140,248,0.25)" },
                  { color: "from-amber-900/60 to-yellow-900/40", label: "OP", glow: "rgba(245,158,11,0.25)" },
                ].map((card, j) => (
                  <motion.div
                    key={j}
                    whileHover={{ scale: 1.06, y: -3 }}
                    transition={{ duration: 0.2 }}
                    className={`aspect-[2/3] rounded-lg bg-gradient-to-br ${card.color} border border-white/5 relative overflow-hidden cursor-pointer`}
                    style={{ boxShadow: `0 4px 15px ${card.glow}` }}
                  >
                    <div className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-bold text-white/50 font-mono">{card.label}</div>
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_60%)]" />
                  </motion.div>
                ))}
              </div>
              {/* Bottom bar */}
              <div className="absolute bottom-0 inset-x-0 px-4 py-3 border-t border-gray-800/40 bg-vault-900/80 flex justify-between items-center">
                <span className="text-[9px] text-gray-500">142 cards · 8 sets</span>
                <span className="text-[9px] font-mono font-bold text-gold-400">$18,450.00</span>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-5">
              <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.2em] font-semibold">Visual Collection</p>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Every card, beautifully organized
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                Browse your collection in a gorgeous card grid. Filter by game, set, rarity, or condition.
                Add condition grades, purchase price, and personal notes — the way a real collector would.
              </p>
            </div>
          </div>

          {/* Feature 2: Dashboard */}
          <div ref={el => { featuresRef.current[1] = el; }} className="flex flex-col-reverse md:flex-row items-center gap-14">
            <div className="w-full md:w-1/2 space-y-5">
              <p className="text-blue-400/70 text-[10px] uppercase tracking-[0.2em] font-semibold">Live Portfolio</p>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Treat your collection like an investment
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                Real-time value charts, daily gains and losses, market trend alerts.
                Know exactly when that Charizard SAR is peaking — and when to hold.
              </p>
            </div>
            {/* CSS Mockup: Chart dashboard */}
            <div className="w-full md:w-1/2 aspect-video rounded-2xl border border-blue-500/15 bg-vault-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group hover:border-blue-500/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent" />
              {/* Fake navbar */}
              <div className="relative px-4 py-3 border-b border-gray-800/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="text-[9px] text-gray-600 ml-2 font-mono">vault.tcgtracker.app/dashboard</span>
              </div>
              <div className="relative p-4 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Total Value", val: "$18,450", sub: "+$440 today", col: "text-gold-400", subc: "text-green-400" },
                    { label: "Cards", val: "142", sub: "3 games", col: "text-white", subc: "text-gray-500" },
                    { label: "Best card", val: "$4,200", sub: "Black Lotus", col: "text-blue-300", subc: "text-gray-500" },
                  ].map((s, j) => (
                    <div key={j} className="bg-vault-900/80 rounded-lg p-2 border border-gray-800/50">
                      <div className="text-[7px] text-gray-600 uppercase tracking-wide mb-0.5">{s.label}</div>
                      <div className={`text-[13px] font-mono font-bold ${s.col}`}>{s.val}</div>
                      <div className={`text-[7px] ${s.subc}`}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Fake chart */}
                <div className="bg-vault-900/60 rounded-lg border border-gray-800/40 p-3 h-[88px] relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4841a" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#d4841a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,45 C30,42 50,38 80,30 C110,22 130,35 160,28 C190,21 210,15 240,10 C260,7 280,12 300,8" stroke="#e8a030" strokeWidth="1.8" fill="none" />
                    <path d="M0,45 C30,42 50,38 80,30 C110,22 130,35 160,28 C190,21 210,15 240,10 C260,7 280,12 300,8 L300,60 L0,60 Z" fill="url(#chartGrad)" />
                  </svg>
                  <div className="absolute top-2 right-2 text-[8px] font-bold text-green-400">+12.4% ↑</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Alerts */}
          <div ref={el => { featuresRef.current[2] = el; }} className="flex flex-col md:flex-row items-center gap-14">
            {/* CSS Mockup: Alert notifications */}
            <div className="w-full md:w-1/2 aspect-video rounded-2xl border border-green-500/15 bg-vault-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group hover:border-green-500/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/8 to-transparent" />
              <div className="relative px-4 py-3 border-b border-gray-800/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="text-[9px] text-gray-600 ml-2 font-mono">Price Alerts</span>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { card: "Charizard ex SAR", trigger: "Above $800", status: "🔴 TRIGGERED", val: "$842", col: "border-red-700/40 bg-red-900/15" },
                  { card: "Black Lotus LP", trigger: "Below $5,000", status: "🟢 Active", val: "$4,200", col: "border-green-700/30 bg-green-900/10" },
                  { card: "Luffy Manga Rare", trigger: "Above $1,500", status: "🟡 Watching", val: "$1,100", col: "border-yellow-700/30 bg-yellow-900/10" },
                  { card: "Pikachu Illustrator", trigger: "Any change >5%", status: "🟢 Active", val: "$9,100", col: "border-green-700/30 bg-green-900/10" },
                ].map((alert, j) => (
                  <div key={j} className={`flex items-center justify-between p-2.5 rounded-lg border ${alert.col}`}>
                    <div>
                      <div className="text-[10px] font-bold text-white">{alert.card}</div>
                      <div className="text-[8px] text-gray-500">{alert.trigger}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-gold-400">{alert.val}</div>
                      <div className="text-[8px] text-gray-400">{alert.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-5">
              <p className="text-green-400/70 text-[10px] uppercase tracking-[0.2em] font-semibold">Smart Alerts</p>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Never miss the right moment to sell
              </h3>
              <p className="text-lg text-gray-400 leading-relaxed">
                Set price alerts for any card in your collection or watchlist.
                Get notified instantly when the market moves. One alert
                paid for our Pro subscription in a single weekend.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Bell className="w-4 h-4 text-green-400" />
                <span>Email, push, and in-app notifications</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SUPPORTED GAMES ── */}
      <section className="py-24 bg-vault-800/30 border-y border-gold-500/8">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Multi-game support</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Every Game. One Vault.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {games.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className={`relative group rounded-xl ${game.cardFrame} overflow-hidden cursor-pointer`}
                style={{ boxShadow: `0 8px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)` }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10"
                  style={{ boxShadow: `inset 0 0 40px ${game.glow}` }}
                />

                {/* Card frame bg */}
                <div className={`absolute inset-0 bg-gradient-to-b ${game.innerBg}`} />

                {/* Card header bar */}
                <div
                  className="relative z-20 px-3 pt-3 pb-2 border-b flex justify-between items-center"
                  style={{ borderColor: `${game.energyColor}22` }}
                >
                  <span className="font-display font-bold text-white text-[11px] tracking-wide truncate pr-1">{game.name}</span>
                  <span className="text-base shrink-0" style={{ filter: `drop-shadow(0 0 6px ${game.energyColor}88)` }}>{game.icon}</span>
                </div>

                {/* Art zone */}
                <div
                  className="relative z-20 mx-2.5 my-2 h-[76px] rounded-lg overflow-hidden flex items-center justify-center border"
                  style={{ borderColor: `${game.energyColor}25`, background: `radial-gradient(ellipse at center, ${game.energyColor}18 0%, transparent 70%)` }}
                >
                  <span className="text-5xl opacity-25 select-none">{game.icon}</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                  {/* Stat badge */}
                  <div
                    className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border"
                    style={{ color: game.energyColor, background: `${game.energyColor}18`, borderColor: `${game.energyColor}35` }}
                  >
                    {game.statLabel} {game.statVal}
                  </div>
                </div>

                {/* Type line */}
                <div
                  className="relative z-20 mx-2.5 mb-2 px-1.5 py-0.5 rounded-sm border text-[7.5px] italic text-gray-500"
                  style={{ borderColor: `${game.energyColor}20` }}
                >
                  {game.cardType}
                </div>

                {/* Energy pips row */}
                <div className="relative z-20 px-3 pb-2.5 flex items-center justify-between">
                  <div className="flex gap-1">
                    {game.energyPips.map((pip, j) => (
                      <span
                        key={j}
                        className="w-2.5 h-2.5 rounded-full inline-block border border-white/10"
                        style={{ background: pip, boxShadow: `0 0 6px ${pip}55` }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: game.energyColor, background: `${game.energyColor}18` }}
                  >
                    {game.count}
                  </span>
                </div>

                {/* Card number / mechanic footer */}
                <div
                  className="relative z-20 px-3 pb-2.5 flex justify-between items-center border-t"
                  style={{ borderColor: `${game.energyColor}15` }}
                >
                  <span className="text-[7px] text-gray-700 font-mono">{game.mechanic}</span>
                  <span className="text-[7px] text-gray-700 font-mono">{game.desc.split(" ").slice(-2).join(" ")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-gradient-to-b from-vault-900 to-vault-800/40">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Community</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Collectors Trust TCG Tracker
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                user: "PkmnMaster_99",
                avatar: "P",
                avatarBg: "from-red-700 to-orange-800",
                review: "Finally a tracker that understands condition multipliers. Added my PSA 10 Charizard VMAX and it pulled the exact grade premium. My whole binder looks like a proper portfolio now.",
                tag: "Pokémon collector · 8 years",
                rotation: -1.5,
              },
              {
                user: "LotusSeeker",
                avatar: "L",
                avatarBg: "from-blue-700 to-indigo-800",
                review: "The price alert alone paid for my Pro sub within a week. Caught the spike on my Revised Dual Lands and sold right into the hype. That alert was worth $600.",
                tag: "MTG vintage · 15 years",
                rotation: 0,
              },
              {
                user: "OP_PirateKing",
                avatar: "O",
                avatarBg: "from-yellow-600 to-orange-700",
                review: "Cleanest UI I've found. Scanning Japanese One Piece cards directly into my vault is a lifesaver. Even pulls the Japanese set name and translates it. Insane quality.",
                tag: "One Piece TCG · 2 years",
                rotation: 1.5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95, rotate: t.rotation }}
                whileInView={{ opacity: 1, scale: 1, rotate: t.rotation }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8, rotate: 0, transition: { duration: 0.25 } }}
                className="bg-vault-800/70 border border-gray-800/60 border-l-[3px] border-l-gold-500 p-7 rounded-2xl relative overflow-hidden flex flex-col group"
              >
                {/* Quote mark */}
                <div className="absolute top-2 right-5 text-gold-500/8 text-[8rem] font-serif leading-none pointer-events-none select-none">
                  "
                </div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                {/* Review */}
                <p className="text-gray-300 text-sm mb-6 flex-grow leading-relaxed relative z-10">
                  &ldquo;{t.review}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 mt-auto relative z-10">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shrink-0 border border-white/10`}>
                    <span className="font-bold text-white text-sm">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.user}</div>
                    <div className="text-[10px] text-gray-500">{t.tag}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 bg-vault-900 border-y border-gold-500/8">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Simple Pricing</h2>
          </motion.div>

          <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 items-stretch">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-vault-700/70 border border-gray-700/60 rounded-2xl p-8 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h3 className="font-display text-2xl font-bold text-white mb-1">Basic</h3>
              <p className="text-gray-400 text-sm mb-6">For casual collectors just getting started.</p>
              <div className="font-display text-4xl font-bold text-white mb-8">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-3.5 mb-8 flex-grow text-sm">
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gray-400 w-4 h-4 shrink-0" /> Up to 100 cards</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gray-400 w-4 h-4 shrink-0" /> Basic portfolio tracking</li>
                <li className="flex items-center gap-3 text-gray-500 opacity-45"><Check className="text-gray-700 w-4 h-4 shrink-0" /><span className="line-through">Real-time price alerts</span></li>
                <li className="flex items-center gap-3 text-gray-500 opacity-45"><Check className="text-gray-700 w-4 h-4 shrink-0" /><span className="line-through">Export to CSV</span></li>
              </ul>
              <button className="w-full py-3.5 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold transition-colors text-sm">
                Get Started Free
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-amber-950/70 to-vault-700/90 border-2 border-gold-500/70 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(212,132,26,0.18),0_4px_32px_rgba(0,0,0,0.6)] flex flex-col md:scale-[1.03]"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold-500 text-vault-900 font-bold px-4 py-1 rounded-full text-xs tracking-widest uppercase">
                Most Popular
              </div>
              <h3 className="font-display text-2xl font-bold text-gold-400 mb-1">Pro Vault</h3>
              <p className="text-gray-500 text-sm mb-6">For serious collectors who mean business.</p>
              <div className="font-display text-4xl font-bold text-white mb-8">$4.99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
              <ul className="space-y-3.5 mb-8 flex-grow text-sm">
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gold-500 w-4 h-4 shrink-0" /> Unlimited cards</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gold-500 w-4 h-4 shrink-0" /> Advanced analytics & charts</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gold-500 w-4 h-4 shrink-0" /> Real-time price alerts</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gold-500 w-4 h-4 shrink-0" /> Export to CSV & PDF</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gold-500 w-4 h-4 shrink-0" /> 12-month price history</li>
              </ul>
              <button className="w-full py-3.5 rounded-xl bg-fire-500 hover:bg-fire-400 text-white font-bold transition-all duration-200 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] text-sm">
                Upgrade to Pro Vault
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-vault-900" />
        {/* Card-back diamond grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(-45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 30px),
              repeating-linear-gradient( 45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 30px)
            `,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, rgba(212,132,26,0.06) 50%, transparent 80%)' }} />

        {/* Floating card silhouettes */}
        {[
          { rot: -12, left: "3%",  top: "20%", opacity: 0.04, w: "60px", h: "84px" },
          { rot: 8,   right: "4%", top: "30%", opacity: 0.04, w: "55px", h: "77px" },
          { rot: -5,  left: "8%",  bottom: "20%", opacity: 0.03, w: "48px", h: "67px" },
          { rot: 15,  right: "9%", bottom: "25%", opacity: 0.03, w: "52px", h: "73px" },
        ].map((card, i) => (
          <div
            key={i}
            className="absolute rounded-[8px] border border-gold-500 pointer-events-none"
            style={{
              ...(card.left ? { left: card.left } : {}),
              ...(card.right ? { right: (card as { right: string }).right } : {}),
              ...(card.top ? { top: card.top } : {}),
              ...(card.bottom ? { bottom: (card as { bottom: string }).bottom } : {}),
              width: card.w, height: card.h,
              opacity: card.opacity,
              transform: `rotate(${card.rot}deg)`,
            }}
          />
        ))}

        <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Rarity badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-gold-500/30 rounded-full bg-gold-500/8"
              style={{ animation: "rarityPulse 3s ease-in-out infinite" }}>
              <span className="text-gold-400 text-sm">★★★</span>
              <span className="text-gold-400 text-[10px] font-semibold tracking-[0.2em] uppercase">Secret Rare Access</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-white leading-tight">
              Your Collection<br />
              <span className="text-gold-gradient">Deserves a Vault</span>
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Join 12,400+ collectors tracking their cards, watching the market, and
              building the collection they&apos;ve always dreamed of.
            </p>

            {/* Game energy pips */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[
                { label: "PKM", color: "#ef4444", sym: "⚡" },
                { label: "MTG", color: "#3b82f6", sym: "✦" },
                { label: "YGO", color: "#a855f7", sym: "★" },
                { label: "OP",  color: "#eab308", sym: "☠" },
              ].map((g, j) => (
                <div key={j} className="flex items-center gap-1.5 text-[9px] font-bold font-mono" style={{ color: g.color }}>
                  <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[7px]"
                    style={{ borderColor: g.color, background: `${g.color}18` }}>
                    {g.sym}
                  </span>
                  {g.label}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-4 rounded-sm bg-fire-500 hover:bg-fire-400 text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_28px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.65)] font-display">
                Open Your Vault — Free
              </button>
              <button className="px-10 py-4 rounded-sm border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                See the Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
