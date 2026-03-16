import { motion } from "framer-motion";

const GAME_CONFIG: Record<string, {
  color: string;
  glow: string;
  abbr: string;
  symbol: string;
  cardGradient: string;
  topBleed: string;
  badgeClass: string;
  valueColor: string;
}> = {
  "Pokémon": {
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    abbr: "PKM",
    symbol: "⚡",
    cardGradient: "linear-gradient(155deg, #7f1d1d 0%, #450a0a 55%, #1c0404 100%)",
    topBleed: "rgba(239,68,68,0.12)",
    badgeClass: "bg-red-950/70 text-red-300 border-red-800/50",
    valueColor: "#ef4444",
  },
  "Magic: The Gathering": {
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.4)",
    abbr: "MTG",
    symbol: "✦",
    cardGradient: "linear-gradient(155deg, #1e3a6e 0%, #0a1a3e 55%, #040a1e 100%)",
    topBleed: "rgba(59,130,246,0.12)",
    badgeClass: "bg-blue-950/70 text-blue-300 border-blue-800/50",
    valueColor: "#3b82f6",
  },
  "One Piece": {
    color: "#eab308",
    glow: "rgba(234,179,8,0.4)",
    abbr: "OP",
    symbol: "☠",
    cardGradient: "linear-gradient(155deg, #713f12 0%, #3d1e04 55%, #1c0e00 100%)",
    topBleed: "rgba(234,179,8,0.12)",
    badgeClass: "bg-yellow-950/70 text-yellow-300 border-yellow-800/50",
    valueColor: "#eab308",
  },
  "Yu-Gi-Oh!": {
    color: "#a855f7",
    glow: "rgba(168,85,247,0.4)",
    abbr: "YGO",
    symbol: "★",
    cardGradient: "linear-gradient(155deg, #3b0764 0%, #1e0336 55%, #0d0118 100%)",
    topBleed: "rgba(168,85,247,0.12)",
    badgeClass: "bg-purple-950/70 text-purple-300 border-purple-800/50",
    valueColor: "#a855f7",
  },
};

const FALLBACK_CFG = GAME_CONFIG["Pokémon"];

function MiniCard({
  cfg,
  rotate,
  offsetX,
  offsetY,
  zIndex,
  dim,
}: {
  cfg: typeof FALLBACK_CFG;
  rotate: number;
  offsetX: number;
  offsetY: number;
  zIndex: number;
  dim: boolean;
}) {
  return (
    <div
      className="absolute w-[68px] h-[96px] rounded-lg overflow-hidden shadow-xl"
      style={{
        background: cfg.cardGradient,
        border: `1px solid ${cfg.color}30`,
        transform: `rotate(${rotate}deg) translateX(${offsetX}px) translateY(${offsetY}px)`,
        zIndex,
        opacity: dim ? 0.5 : 1,
      }}
    >
      <div className="absolute inset-[2px] rounded-md border border-white/5" />
      <div
        className="absolute inset-0 flex items-center justify-center text-4xl select-none"
        style={{ color: cfg.color, opacity: 0.14 }}
      >
        {cfg.symbol}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-black/30" />
    </div>
  );
}

export function DeckCard({ deck }: { deck: any }) {
  const cfg = GAME_CONFIG[deck.game as string] ?? FALLBACK_CFG;
  const count = deck.card_count || 0;
  const maxCards = 60;
  const pct = Math.min((count / maxCards) * 100, 100);

  return (
    <motion.div
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group relative flex flex-col w-full h-[340px] rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: "linear-gradient(160deg, #111318 0%, #0c0e12 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Hover border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        variants={{
          rest: { opacity: 0 },
          hover: { opacity: 1 },
        }}
        transition={{ duration: 0.22 }}
        style={{ boxShadow: `0 0 0 1.5px ${cfg.color}45, 0 8px 40px ${cfg.glow}` }}
      />

      {/* Top colour bleed */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.topBleed}, transparent 70%)` }}
      />

      {/* ── CARD ART ZONE ── */}
      <div className="relative h-[190px] flex items-center justify-center overflow-hidden">
        {/* Subtle diagonal texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 10px)`,
          }}
        />

        {/* Side cards */}
        <MiniCard cfg={cfg} rotate={-16} offsetX={-54} offsetY={10} zIndex={1} dim />
        <MiniCard cfg={cfg} rotate={16}  offsetX={54}  offsetY={10} zIndex={2} dim />

        {/* Center card — lifts on hover */}
        <motion.div
          className="absolute w-[78px] h-[110px] rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: cfg.cardGradient,
            border: `1.5px solid ${cfg.color}50`,
            zIndex: 10,
          }}
          variants={{
            rest:  { y: 0,   rotate: 0,  scale: 1    },
            hover: { y: -18, rotate: -3, scale: 1.08 },
          }}
          transition={{ type: "spring", damping: 16, stiffness: 240 }}
        >
          {/* Inner frame */}
          <div className="absolute inset-[3px] rounded-lg border border-white/7" />
          {/* Art */}
          <div className="absolute inset-[8px] bottom-[22px] rounded-sm overflow-hidden flex items-center justify-center">
            <motion.div
              className="text-5xl select-none"
              style={{ color: cfg.color, filter: `drop-shadow(0 0 16px ${cfg.glow})` }}
              variants={{
                rest:  { opacity: 0.45, scale: 1    },
                hover: { opacity: 0.7,  scale: 1.12 },
              }}
              transition={{ duration: 0.25 }}
            >
              {cfg.symbol}
            </motion.div>
          </div>
          {/* Bottom strip */}
          <div className="absolute bottom-0 inset-x-0 h-[22px] bg-black/55 flex items-center justify-center border-t border-white/5">
            <span className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: cfg.color }}>
              {cfg.abbr}
            </span>
          </div>
          {/* Holo shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-black/25" />
        </motion.div>

        {/* Card count pill */}
        <div
          className="absolute bottom-3 right-4 px-2 py-[3px] rounded-full text-[8px] font-bold font-mono border"
          style={{
            background: `${cfg.color}14`,
            borderColor: `${cfg.color}30`,
            color: cfg.color,
          }}
        >
          {count}/{maxCards}
        </div>
      </div>

      {/* ── INFO ZONE ── */}
      <div className="relative flex flex-col flex-1 px-4 pt-3 pb-4 border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <h3
              className="font-display font-bold text-white text-[15px] leading-tight truncate"
              title={deck.name}
            >
              {deck.name}
            </h3>
            <span
              className={`shrink-0 text-[7px] font-bold px-1.5 py-[3px] rounded-md border uppercase tracking-[0.12em] font-mono ${cfg.badgeClass}`}
            >
              {cfg.abbr}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3.5">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${cfg.color}bb, ${cfg.color}66)` }}
              />
            </div>
          </div>

          {/* Value + date */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[8px] text-gray-700 uppercase tracking-widest mb-0.5">Est. Value</p>
              <p className="font-mono font-bold text-sm" style={{ color: cfg.valueColor }}>
                €{deck.total_value ? deck.total_value.toFixed(2) : "0.00"}
              </p>
            </div>
            <span className="text-[9px] text-gray-700 tabular-nums">
              {new Date(deck.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
