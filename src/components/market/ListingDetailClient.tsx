"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Shield, Clock, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { DbMarketListing } from "@/types/database";
import { useAuth } from "@/hooks/use-auth";

const GAME_CONFIG: Record<string, { color: string; label: string; symbol: string }> = {
  "Pokémon":              { color: "#ef4444", label: "Pokémon",              symbol: "⚡" },
  "Magic: The Gathering": { color: "#3b82f6", label: "Magic: The Gathering", symbol: "✦" },
  "One Piece":            { color: "#eab308", label: "One Piece",            symbol: "☠" },
  "Yu-Gi-Oh!":            { color: "#a855f7", label: "Yu-Gi-Oh!",            symbol: "★" },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  mint:      { label: "Mint",     color: "#22d3ee", bg: "rgba(34,211,238,0.1)",   desc: "Perfect, unplayed condition" },
  near_mint: { label: "Near Mint",color: "#4ade80", bg: "rgba(74,222,128,0.1)",   desc: "Minimal wear, excellent" },
  played:    { label: "Played",   color: "#facc15", bg: "rgba(250,204,21,0.1)",   desc: "Visible wear from use" },
  damaged:   { label: "Damaged",  color: "#f87171", bg: "rgba(248,113,113,0.1)",  desc: "Heavy wear or creases" },
};

interface ListingDetailClientProps {
  listing: DbMarketListing;
}

export default function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);

  const game   = GAME_CONFIG[listing.game]   ?? { color: "#d4af37", label: listing.game, symbol: "◈" };
  const cond   = CONDITION_CONFIG[listing.condition] ?? CONDITION_CONFIG.near_mint;
  const isOwn  = user?.id === listing.seller_id;
  const initials = (listing.seller_username ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const listedAgo = (() => {
    const diffMs  = Date.now() - new Date(listing.created_at).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24)  return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  })();

  const handleBuy = () => {
    setBuying(true);
    // Placeholder — real checkout logic goes here
    setTimeout(() => {
      setBuying(false);
      toast.info("Checkout coming soon! This feature is under construction.");
    }, 800);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#080a0d]" />
        <div
          className="absolute top-0 left-0 right-0 h-80 opacity-[0.06]"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${game.color}, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto py-8 px-5 lg:px-10">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            href="/market"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Market
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-10">

          {/* ── LEFT: Card image ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="relative aspect-[3/4] rounded-2xl overflow-hidden border"
              style={{
                background: "linear-gradient(160deg, #16191f, #0a0c10)",
                borderColor: `${game.color}30`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${game.color}10`,
              }}
            >
              {listing.card_image ? (
                <Image
                  src={listing.card_image}
                  alt={listing.card_name}
                  fill
                  className="object-contain p-4"
                  sizes="300px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="text-6xl opacity-10">{game.symbol}</span>
                  <span className="text-xs text-gray-700 uppercase tracking-widest">No image</span>
                </div>
              )}

              {/* Game color top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, transparent, ${game.color}, transparent)` }}
              />
            </div>
          </motion.div>

          {/* ── RIGHT: Listing details ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Title & game */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: `${game.color}20`, color: game.color, border: `1px solid ${game.color}35` }}
                >
                  {game.symbol} {game.label}
                </span>
                {listing.rarity && (
                  <span className="px-2.5 py-1 rounded-lg text-xs text-gray-500 bg-white/4 border border-white/8">
                    {listing.rarity}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                {listing.card_name}
              </h1>
            </div>

            {/* Price block */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: "linear-gradient(135deg, #16191f, #0f1115)",
                borderColor: "rgba(212,175,55,0.15)",
              }}
            >
              <p className="text-[9px] text-gold-400/50 uppercase tracking-[0.2em] font-bold mb-1">
                Asking Price
              </p>
              <p className="font-display text-4xl font-bold text-gold-400 mb-4">
                €{listing.price.toFixed(2)}
              </p>

              {isOwn ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">This is your listing.</p>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-vault-900 transition-all disabled:opacity-70"
                  style={{
                    background: "linear-gradient(135deg, #f6d159, #d4af37)",
                    boxShadow: "0 0 30px rgba(212,175,55,0.3)",
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {buying ? "Processing…" : "Buy Now"}
                </motion.button>
              )}

              <p className="text-[10px] text-gray-700 text-center mt-3 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Buyer protection coming soon
              </p>
            </div>

            {/* Condition */}
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ background: cond.bg, borderColor: `${cond.color}25` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${cond.color}20` }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: cond.color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: cond.color }}>{cond.label}</p>
                <p className="text-[11px] text-gray-600">{cond.desc}</p>
              </div>
            </div>

            {/* Seller profile */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-3">Seller</p>
              <div className="flex items-center gap-3">
                {listing.seller_avatar ? (
                  <Image
                    src={listing.seller_avatar}
                    alt={listing.seller_username ?? "Seller"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${game.color}25`, color: game.color }}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {listing.seller_username ?? "Anonymous Seller"}
                  </p>
                  <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Listed {listedAgo}
                  </p>
                </div>
              </div>
            </div>

            {/* Listing meta */}
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/3 border border-white/6">
                <Tag className="w-3 h-3" />
                ID: <span className="font-mono text-gray-500">{listing.id.slice(0, 8)}…</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/3 border border-white/6">
                <Clock className="w-3 h-3" />
                {new Date(listing.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
