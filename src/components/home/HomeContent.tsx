'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, Star, Check, Bell, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

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

export default function HomeContent() {
  const statsRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLSpanElement | null)[]>([]);

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
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-vault-800/80 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-vault-800/80 to-transparent pointer-events-none" />
      </div>

      {/* ── STATS — editorial strip ── */}
      <section ref={statsRef} className="py-20 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-y-0 relative">
            {[
              { value: "12400", suffix: "+", label: "vaults live", sublabel: "active collectors worldwide", prefix: "" },
              { value: "2.3", suffix: "M", label: "in tracked value", sublabel: "across all vaults today", prefix: "$" },
              { value: "847", suffix: "K+", label: "cards catalogued", sublabel: "across 4 games", prefix: "" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center relative"
              >
                {i > 0 && (
                  <div className="hidden md:block absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent" />
                )}
                <div className="font-display text-5xl md:text-6xl font-bold text-white leading-none mb-2">
                  {stat.prefix}
                  <span ref={el => { countersRef.current[i] = el; }} data-target={stat.value}>0</span>
                  {stat.suffix}
                </div>
                <div className="text-gold-400 text-[10px] font-mono uppercase tracking-[0.25em] font-semibold">{stat.label}</div>
                <div className="text-gray-600 text-xs mt-1">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ── */}
      <section className="py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-center">

            {/* Copy */}
            <div className="w-full lg:w-[40%] space-y-8">
              <div>
                <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-4">Your vault · live</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-[1.15]">
                  Know what your collection<br />
                  <span className="text-gold-gradient">is worth. Right now.</span>
                </h2>
              </div>

              <div className="space-y-6 pt-2">
                {[
                  {
                    icon: "◆",
                    title: "Add a card in 10 seconds",
                    desc: "Search by name, set, or number. We pull condition multipliers, PSA premiums, and current market pricing automatically.",
                    col: "text-gold-400",
                  },
                  {
                    icon: "▲",
                    title: "Your vault value, updated daily",
                    desc: "See your total number every morning. Watch which card moved overnight. Know exactly where you stand.",
                    col: "text-electric-400",
                  },
                  {
                    icon: "◉",
                    title: "Alerts when your grails spike",
                    desc: "Set a target price. We watch the market. When it hits, you'll know before anyone in your local group chat.",
                    col: "text-fire-400",
                  },
                ].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.5 }}
                    className="flex items-start gap-4"
                  >
                    <span className={`text-base font-bold mt-0.5 shrink-0 ${feat.col}`}>{feat.icon}</span>
                    <div>
                      <div className="text-white font-semibold text-sm mb-1">{feat.title}</div>
                      <div className="text-gray-400 text-sm leading-relaxed">{feat.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-fire-500 hover:bg-fire-400 text-white font-bold rounded-sm transition-all duration-200 text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.55)]">
                Start tracking free
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mockup — full product dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="w-full lg:w-[60%]"
            >
              <div className="rounded-2xl border border-gold-500/20 bg-vault-800 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7),0_0_40px_rgba(212,132,26,0.07)]">
                {/* Browser chrome */}
                <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-2 bg-vault-900/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <div className="flex-1 mx-4">
                    <div className="bg-vault-700/70 rounded-md px-3 py-1 text-[9px] text-gray-600 font-mono text-center max-w-[240px] mx-auto">
                      tcgmultiverse.app/vault
                    </div>
                  </div>
                </div>

                {/* Dashboard */}
                <div className="p-5 space-y-4">

                  {/* Portfolio header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 font-mono">Total vault value</div>
                      <div className="font-display text-[2rem] font-bold text-white font-mono leading-none">
                        $18,450<span className="text-gray-600 text-xl">.00</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <ArrowUpRight className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-mono font-bold">+$440.00</span>
                        <span className="text-gray-600 text-xs">today</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 font-mono">30d return</div>
                      <div className="text-green-400 font-mono font-bold text-2xl leading-none">+12.4%</div>
                      <div className="flex items-center gap-1.5 justify-end mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] text-gray-600 font-mono">live</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-vault-900/70 rounded-xl border border-gray-800/40 p-4 relative overflow-hidden" style={{ height: '88px' }}>
                    <svg className="w-full h-full" viewBox="0 0 400 56" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4841a" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#d4841a" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,50 C40,46 70,42 110,33 C140,26 165,38 200,28 C235,18 268,12 308,7 C338,4 368,9 400,4"
                        stroke="#e8a030" strokeWidth="1.8" fill="none" strokeLinecap="round"
                      />
                      <path
                        d="M0,50 C40,46 70,42 110,33 C140,26 165,38 200,28 C235,18 268,12 308,7 C338,4 368,9 400,4 L400,56 L0,56 Z"
                        fill="url(#chartGrad)"
                      />
                    </svg>
                    <div className="absolute top-2.5 right-3 text-[8px] font-mono text-gold-400/60">30-day chart</div>
                  </div>

                  {/* Card grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Charizard ex SAR", game: "PKM", price: "$842", change: "+4.2%", up: true, col: "from-red-900/50 to-orange-950/70", border: "border-red-800/40" },
                      { label: "Black Lotus LP", game: "MTG", price: "$4,200", change: "+1.8%", up: true, col: "from-blue-950/70 to-indigo-950/80", border: "border-blue-800/30" },
                      { label: "Luffy Manga", game: "OP", price: "$1,100", change: "-2.1%", up: false, col: "from-yellow-950/70 to-amber-950/80", border: "border-yellow-800/30" },
                      { label: "Dark Magician", game: "YGO", price: "$380", change: "+3.3%", up: true, col: "from-purple-950/70 to-violet-950/80", border: "border-purple-800/30" },
                    ].map((card, j) => (
                      <div key={j} className={`rounded-lg bg-gradient-to-b ${card.col} border ${card.border} p-2.5 space-y-1.5`}>
                        <div className={`text-[7px] font-bold font-mono ${gameColors[card.game]}`}>{card.game}</div>
                        <div className="text-[7.5px] text-gray-400 leading-tight line-clamp-2">{card.label}</div>
                        <div className="text-[10px] font-mono font-bold text-gold-400 leading-none">{card.price}</div>
                        <div className={`text-[7.5px] font-mono font-bold ${card.up ? 'text-green-400' : 'text-red-400'}`}>{card.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Alert row */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-fire-500/8 border border-fire-500/25"
                  >
                    <div className="w-7 h-7 rounded-full bg-fire-500/15 border border-fire-500/30 flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5 text-fire-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-white">Price alert triggered</div>
                      <div className="text-[9px] text-gray-500">Charizard ex SAR crossed $800 — now at $842</div>
                    </div>
                    <div className="text-[8px] text-gray-600 font-mono shrink-0">2m ago</div>
                  </motion.div>

                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── ONE VAULT, ALL GAMES ── */}
      <section className="py-24 border-y border-white/[0.04] bg-vault-800/20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Multi-game support</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Four games. One vault.
            </h2>
            <p className="text-gray-500 text-lg mt-2">Zero spreadsheets.</p>
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
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                  style={{ boxShadow: `inset 0 0 40px ${game.glow}` }} />
                <div className={`absolute inset-0 bg-gradient-to-b ${game.innerBg}`} />
                <div className="relative z-20 px-3 pt-3 pb-2 border-b flex justify-between items-center"
                  style={{ borderColor: `${game.energyColor}22` }}>
                  <span className="font-display font-bold text-white text-[11px] tracking-wide truncate pr-1">{game.name}</span>
                  <span className="text-base shrink-0" style={{ filter: `drop-shadow(0 0 6px ${game.energyColor}88)` }}>{game.icon}</span>
                </div>
                <div className="relative z-20 mx-2.5 my-2 h-[76px] rounded-lg overflow-hidden flex items-center justify-center border"
                  style={{ borderColor: `${game.energyColor}25`, background: `radial-gradient(ellipse at center, ${game.energyColor}18 0%, transparent 70%)` }}>
                  <span className="text-5xl opacity-25 select-none">{game.icon}</span>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border"
                    style={{ color: game.energyColor, background: `${game.energyColor}18`, borderColor: `${game.energyColor}35` }}>
                    {game.statLabel} {game.statVal}
                  </div>
                </div>
                <div className="relative z-20 mx-2.5 mb-2 px-1.5 py-0.5 rounded-sm border text-[7.5px] italic text-gray-500"
                  style={{ borderColor: `${game.energyColor}20` }}>
                  {game.cardType}
                </div>
                <div className="relative z-20 px-3 pb-2.5 flex items-center justify-between">
                  <div className="flex gap-1">
                    {game.energyPips.map((pip, j) => (
                      <span key={j} className="w-2.5 h-2.5 rounded-full inline-block border border-white/10"
                        style={{ background: pip, boxShadow: `0 0 6px ${pip}55` }} />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: game.energyColor, background: `${game.energyColor}18` }}>{game.count}</span>
                </div>
                <div className="relative z-20 px-3 pb-2.5 flex justify-between items-center border-t"
                  style={{ borderColor: `${game.energyColor}15` }}>
                  <span className="text-[7px] text-gray-700 font-mono">{game.mechanic}</span>
                  <span className="text-[7px] text-gray-600 font-mono">{game.desc.split(" ").slice(0, 3).join(" ")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-gradient-to-b from-vault-900 to-vault-800/20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Community</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Real collectors. Real vaults.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                user: "PkmnMaster_99",
                avatar: "P",
                avatarBg: "from-red-700 to-orange-800",
                review: "Caught my Charizard SAR spike 6 days before it peaked. Sold at $842 right into the hype. The alert was free. The call was worth $280.",
                tag: "Pokémon · 8 years · 340 cards",
                rotation: -1.5,
                accent: "border-l-red-500",
              },
              {
                user: "LotusSeeker",
                avatar: "L",
                avatarBg: "from-blue-700 to-indigo-800",
                review: "I have 3 binders, 4 games, zero time for spreadsheets. First tracker where the number on screen actually matches what my collection is worth.",
                tag: "MTG vintage · 15 years · 600+ cards",
                rotation: 0,
                accent: "border-l-blue-500",
              },
              {
                user: "OP_PirateKing",
                avatar: "O",
                avatarBg: "from-yellow-600 to-orange-700",
                review: "Scanning Japanese One Piece cards and having it pull the right rarity, set, and market value in 3 seconds — I stopped using every other tracker the same day.",
                tag: "One Piece TCG · 2 years · 180 cards",
                rotation: 1.5,
                accent: "border-l-yellow-500",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95, rotate: t.rotation }}
                whileInView={{ opacity: 1, scale: 1, rotate: t.rotation }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8, rotate: 0, transition: { duration: 0.25 } }}
                className={`bg-vault-700/60 border border-gray-800/50 border-l-[3px] ${t.accent} p-7 rounded-2xl relative overflow-hidden flex flex-col group shadow-[0_4px_24px_rgba(0,0,0,0.4)]`}
              >
                <div className="absolute top-2 right-5 text-gold-500/6 text-[8rem] font-serif leading-none pointer-events-none select-none">&ldquo;</div>
                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />)}
                </div>
                <p className="text-gray-200 text-sm mb-6 flex-grow leading-relaxed relative z-10">&ldquo;{t.review}&rdquo;</p>
                <div className="flex items-center gap-3 mt-auto relative z-10">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center shrink-0 border border-white/10`}>
                    <span className="font-bold text-white text-sm">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.user}</div>
                    <div className="text-[9px] text-gray-500">{t.tag}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 bg-vault-900 border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold-500/70 text-[10px] uppercase tracking-[0.25em] font-semibold mb-3">Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Start free. Go pro when ready.</h2>
          </motion.div>

          <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 items-stretch">

            {/* Free */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-vault-700/70 border border-gray-700/50 rounded-2xl p-8 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h3 className="font-display text-2xl font-bold text-white mb-1">Basic</h3>
              <p className="text-gray-400 text-sm mb-6">For collectors just getting started. Free, always.</p>
              <div className="font-display text-4xl font-bold text-white mb-8">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-3.5 mb-8 flex-grow text-sm">
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gray-400 w-4 h-4 shrink-0" /> Up to 100 cards</li>
                <li className="flex items-center gap-3 text-gray-200"><Check className="text-gray-400 w-4 h-4 shrink-0" /> Basic portfolio tracking</li>
                <li className="flex items-center gap-3 text-gray-500 opacity-45"><Check className="text-gray-700 w-4 h-4 shrink-0" /><span className="line-through">Real-time price alerts</span></li>
                <li className="flex items-center gap-3 text-gray-500 opacity-45"><Check className="text-gray-700 w-4 h-4 shrink-0" /><span className="line-through">Export to CSV</span></li>
              </ul>
              <button className="w-full py-3.5 rounded-xl border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold transition-colors text-sm">
                Start free
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
              <p className="text-gray-400 text-sm mb-6">For serious collectors who track every move.</p>
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
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(-45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 30px),
              repeating-linear-gradient( 45deg, #d4841a 0, #d4841a 1px, transparent 0, transparent 30px)
            `,
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, rgba(212,132,26,0.06) 50%, transparent 80%)' }}
        />

        {[
          { rot: -12, left: "3%",  top: "20%",    opacity: 0.05, w: "60px", h: "84px" },
          { rot: 8,   right: "4%", top: "30%",    opacity: 0.05, w: "55px", h: "77px" },
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

        <div className="max-w-2xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 border border-gold-500/30 rounded-full bg-gold-500/8"
              style={{ animation: "rarityPulse 3s ease-in-out infinite" }}
            >
              <span className="text-gold-400 text-sm">★★★</span>
              <span className="text-gold-400 text-[10px] font-semibold tracking-[0.2em] uppercase">Secret Rare Access</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-bold mb-4 text-white leading-tight">
              Your collection has a value.<br />
              <span className="text-gold-gradient">Do you know what it is?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              Join 12,400 collectors who check theirs every morning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-4 rounded-sm bg-fire-500 hover:bg-fire-400 text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_28px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.65)] font-display">
                Open Your Vault — Free
              </button>
              <button className="px-10 py-4 rounded-sm border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-medium text-sm transition-colors">
                See the Demo
              </button>
            </div>

            <p className="mt-6 text-[11px] text-gray-600 tracking-wide font-mono">
              No credit card. No import limits. Just your vault.
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
