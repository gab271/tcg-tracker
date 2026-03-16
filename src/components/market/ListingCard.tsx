"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { DbMarketListing } from "@/types/database";

const GAME_CONFIG: Record<string, { color: string; label: string; symbol: string }> = {
  "Pokémon":              { color: "#ef4444", label: "PKM",  symbol: "⚡" },
  "Magic: The Gathering": { color: "#3b82f6", label: "MTG",  symbol: "✦" },
  "One Piece":            { color: "#eab308", label: "OP",   symbol: "☠" },
  "Yu-Gi-Oh!":            { color: "#a855f7", label: "YGO",  symbol: "★" },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  mint:      { label: "Mint",     color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  near_mint: { label: "NM",       color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  played:    { label: "Played",   color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  damaged:   { label: "Damaged",  color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

interface ListingCardProps {
  listing: DbMarketListing;
  isNew?: boolean;
  index?: number;
}

export default function ListingCard({ listing, isNew = false, index = 0 }: ListingCardProps) {
  const game   = GAME_CONFIG[listing.game]   ?? { color: "#d4af37", label: "TCG", symbol: "◈" };
  const cond   = CONDITION_CONFIG[listing.condition] ?? CONDITION_CONFIG.near_mint;
  const initials = (listing.seller_username ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // "New" badge if listed within last 10 minutes
  const listedAt  = new Date(listing.created_at).getTime();
  const isRecent  = isNew || Date.now() - listedAt < 1000 * 60 * 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, type: "spring", damping: 22 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/market/${listing.id}`} className="block">
        <div
          className="relative overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            background: "linear-gradient(160deg, #16191f 0%, #0f1115 100%)",
            borderColor: `${game.color}20`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = `${game.color}50`;
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${game.color}15`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = `${game.color}20`;
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.4)`;
          }}
        >
          {/* Game color top stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, ${game.color}60, transparent)` }}
          />

          {/* Card image area */}
          <div className="relative aspect-[3/4] bg-[#0a0c0f] overflow-hidden">
            {listing.card_image ? (
              <Image
                src={listing.card_image}
                alt={listing.card_name}
                fill
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl opacity-20">{game.symbol}</span>
                <span className="text-xs text-gray-700 uppercase tracking-widest">No image</span>
              </div>
            )}

            {/* Badges row */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
              {/* Game badge */}
              <span
                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
                style={{ background: `${game.color}25`, color: game.color, border: `1px solid ${game.color}40` }}
              >
                {game.label}
              </span>

              {/* NEW pulse badge */}
              {isRecent && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  New
                </span>
              )}
            </div>

            {/* Holographic shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, transparent 30%, ${game.color}08 50%, transparent 70%)`,
                  animation: "holoshimmer 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Card metadata */}
          <div className="p-3 space-y-2">
            <h3 className="text-white font-semibold text-sm leading-tight truncate group-hover:text-gold-300 transition-colors">
              {listing.card_name}
            </h3>

            <div className="flex items-center justify-between gap-2">
              {/* Condition badge */}
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: cond.bg, color: cond.color }}
              >
                {cond.label}
              </span>

              {/* Rarity if available */}
              {listing.rarity && (
                <span className="text-[10px] text-gray-600 truncate max-w-[80px]">{listing.rarity}</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <p className="font-display font-bold text-base text-gold-400">
                €{listing.price.toFixed(2)}
              </p>

              {/* Seller */}
              <div className="flex items-center gap-1.5 min-w-0">
                {listing.seller_avatar ? (
                  <Image
                    src={listing.seller_avatar}
                    alt={listing.seller_username ?? ""}
                    width={18}
                    height={18}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                    style={{ background: `${game.color}30`, color: game.color }}
                  >
                    {initials}
                  </div>
                )}
                <span className="text-[10px] text-gray-600 truncate max-w-[60px]">
                  {listing.seller_username ?? "Seller"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
