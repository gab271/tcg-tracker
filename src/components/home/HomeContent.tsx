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
    border: "border-red-700/40",
    glow: "rgba(239,68,68,0.2)",
    symbol: "⚡",
    desc: "Base Set through Scarlet & Violet",
  },
  {
    name: "Magic: The Gathering",
    count: "890K+",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900/20",
    border: "border-blue-700/40",
    glow: "rgba(59,130,246,0.2)",
    symbol: "✦",
    desc: "Alpha through The Lost Caverns",
  },
  {
    name: "One Piece TCG",
    count: "120K+",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900/20",
    border: "border-yellow-700/40",
    glow: "rgba(234,179,8,0.2)",
    symbol: "☠",
    desc: "Romance Dawn through Wings of Captain",
  },
  {
    name: "Yu-Gi-Oh!",
    count: "340K+",
    color: "#a855f7",
    bg: "from-purple-950 to-purple-900/20",
    border: "border-purple-700/40",
    glow: "rgba(168,85,247,0.2)",
    symbol: "★",
    desc: "LOB through Rage of the Abyss",
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

      {/* ── STATS BAR ── */}
      <section ref={statsRef} className="w-full border-b border-gold-500/10 py-20 bg-vault-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-800/60">
            {[
              { value: "12400", suffix: "+", label: "Collectors worldwide", prefix: "" },
              { value: "2.3", suffix: "M", label: "Total value tracked", prefix: "€" },
              { value: "847", suffix: "K+", label: "Cards registered", prefix: "" },
            ].map((stat, i) => (
              <div key={i} className="py-8 px-8 text-center group">
                <div className="font-display text-4xl md:text-5xl font-bold text-gold-500 mb-2 font-mono">
                  {stat.prefix}
                  <span ref={el => { countersRef.current[i] = el; }} data-target={stat.value}>0</span>
                  {stat.suffix}
                </div>
                <p className="text-gray-500 text-sm tracking-wide">{stat.label}</p>
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
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className={`relative p-8 rounded-2xl ${step.bg} border ${step.border} group`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.bg} border ${step.border}`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className={`font-display font-bold text-4xl ${step.color} opacity-20 group-hover:opacity-35 transition-opacity`}>
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.desc}</p>
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
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,45 C30,42 50,38 80,30 C110,22 130,35 160,28 C190,21 210,15 240,10 C260,7 280,12 300,8" stroke="#d4af37" strokeWidth="1.5" fill="none" />
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
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                style={{
                  "--glow": game.glow,
                } as React.CSSProperties}
                className={`relative group rounded-2xl bg-gradient-to-b ${game.bg} border ${game.border} p-6 cursor-pointer overflow-hidden transition-all duration-300`}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 30px ${game.glow}` }}
                />
                {/* Symbol */}
                <div
                  className="font-display text-5xl font-bold mb-4 opacity-20 group-hover:opacity-35 transition-opacity"
                  style={{ color: game.color }}
                >
                  {game.symbol}
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-1">{game.name}</h3>
                <p className="text-[11px] text-gray-500 mb-4 leading-snug">{game.desc}</p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: game.color, background: `${game.glow}` }}
                >
                  {game.count} cards
                </span>
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
              className="bg-vault-800/60 border border-gray-800 rounded-2xl p-8 flex flex-col"
            >
              <h3 className="font-display text-2xl font-bold text-white mb-1">Basic</h3>
              <p className="text-gray-500 text-sm mb-6">For casual collectors just getting started.</p>
              <div className="font-display text-4xl font-bold text-white mb-8">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-3.5 mb-8 flex-grow text-sm">
                <li className="flex items-center gap-3 text-gray-300"><Check className="text-gray-500 w-4 h-4 shrink-0" /> Up to 100 cards</li>
                <li className="flex items-center gap-3 text-gray-300"><Check className="text-gray-500 w-4 h-4 shrink-0" /> Basic portfolio tracking</li>
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
              className="bg-gradient-to-b from-amber-950/60 to-vault-800/80 border-2 border-gold-500/60 rounded-2xl p-8 relative shadow-[0_0_40px_rgba(212,175,55,0.12)] flex flex-col md:scale-[1.03]"
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
              <button className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] text-sm">
                Upgrade to Pro Vault
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-vault-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-5">Ready to begin?</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-white leading-tight">
              Your Collection<br />
              <span className="text-gold-gradient">Deserves a Vault</span>
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Join 12,400+ collectors tracking their cards, watching the market, and
              building the collection they've always dreamed of.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-4 rounded-sm bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] font-display">
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
