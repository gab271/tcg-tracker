"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ShoppingCart, Tag, Shield, Clock, AlertCircle, MessageSquare,
} from "lucide-react";
import type { DbMarketListing } from "@/types/database";
import { useAuth } from "@/hooks/use-auth";
import WishlistButton from "@/components/wishlist/WishlistButton";
import AlertButton from "@/components/price-alerts/AlertButton";
import BuyConfirmModal from "./BuyConfirmModal";
import MakeOfferModal from "./MakeOfferModal";
import OffersPanel from "./OffersPanel";

const GAME_CONFIG: Record<string, { color: string; label: string; symbol: string }> = {
  "Pokémon":              { color: "#ef4444", label: "Pokémon",              symbol: "⚡" },
  "Magic: The Gathering": { color: "#3b82f6", label: "Magic: The Gathering", symbol: "✦" },
  "One Piece":            { color: "#eab308", label: "One Piece",            symbol: "☠" },
  "Yu-Gi-Oh!":            { color: "#a855f7", label: "Yu-Gi-Oh!",            symbol: "★" },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  mint:      { label: "Mint",      color: "#22d3ee", bg: "rgba(34,211,238,0.1)",   desc: "Perfect, unplayed condition" },
  near_mint: { label: "Near Mint", color: "#4ade80", bg: "rgba(74,222,128,0.1)",   desc: "Minimal wear, excellent" },
  played:    { label: "Played",    color: "#facc15", bg: "rgba(250,204,21,0.1)",   desc: "Visible wear from use" },
  damaged:   { label: "Damaged",   color: "#f87171", bg: "rgba(248,113,113,0.1)",  desc: "Heavy wear or creases" },
};

interface ListingDetailClientProps {
  listing: DbMarketListing;
}

export default function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const { user } = useAuth();
  const [buyOpen, setBuyOpen]   = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [txnId, setTxnId]       = useState<string | null>(null);

  const game  = GAME_CONFIG[listing.game]   ?? { color: "#d4af37", label: listing.game, symbol: "◈" };
  const cond  = CONDITION_CONFIG[listing.condition] ?? CONDITION_CONFIG.near_mint;
  const isOwn = user?.id === listing.seller_id;

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
    const diffDay = Math.floor(diffHr  / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr  < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  })();

  const isSold = listing.status === "sold";

  return (
    <>
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[#080a0d]" />
          <div
            className="absolute top-0 left-0 right-0 h-80 opacity-[0.06]"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${game.color}, transparent 70%)` }}
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

                {/* Sold overlay */}
                {isSold && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-red-400 uppercase tracking-widest rotate-[-20deg] border-4 border-red-400 px-4 py-1">
                      SOLD
                    </span>
                  </div>
                )}

                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${game.color}, transparent)` }}
                />

                {/* Action bar on image */}
                {!isOwn && !isSold && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
                      <WishlistButton
                        cardId={listing.card_id}
                        cardName={listing.card_name}
                        cardImage={listing.card_image ?? undefined}
                        game={listing.game}
                      />
                    </div>
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
                      <AlertButton
                        cardId={listing.card_id}
                        cardName={listing.card_name}
                        cardImage={listing.card_image ?? undefined}
                        game={listing.game}
                        currentPrice={listing.price}
                      />
                    </div>
                  </div>
                )}
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
                  {isSold && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25">
                      SOLD
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
                  {isSold ? "Sold Price" : "Asking Price"}
                </p>
                <p className="font-display text-4xl font-bold text-gold-400 mb-4">
                  €{listing.price.toFixed(2)}
                </p>

                {isSold ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">This listing has been sold.</p>
                  </div>
                ) : isOwn ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/4 border border-white/8">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-500">This is your listing.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Buy Now */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setBuyOpen(true)}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-vault-900 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #f6d159, #d4af37)",
                        boxShadow: "0 0 30px rgba(212,175,55,0.3)",
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy Now — €{listing.price.toFixed(2)}
                    </motion.button>

                    {/* Make Offer */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setOfferOpen(true)}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium text-sm text-blue-300 border border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/8 transition-all"
                    >
                      <Tag className="w-4 h-4" />
                      Make an Offer
                    </motion.button>

                    {/* Wishlist + Alert */}
                    <div className="flex items-center gap-3 pt-1">
                      <WishlistButton
                        cardId={listing.card_id}
                        cardName={listing.card_name}
                        cardImage={listing.card_image ?? undefined}
                        game={listing.game}
                        showLabel
                        className="text-sm"
                      />
                      <span className="text-gray-700">·</span>
                      <AlertButton
                        cardId={listing.card_id}
                        cardName={listing.card_name}
                        cardImage={listing.card_image ?? undefined}
                        game={listing.game}
                        currentPrice={listing.price}
                      />
                    </div>
                  </div>
                )}

                {txnId && (
                  <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-xs text-green-300">
                    ✓ Purchase recorded.{" "}
                    <Link href="/orders" className="underline hover:text-green-200">
                      View in Orders →
                    </Link>
                  </div>
                )}

                <p className="text-[10px] text-gray-700 text-center mt-3 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Peer-to-peer — no payment processor
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

              {/* Offers panel — only visible to the seller */}
              {isOwn && !isSold && (
                <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Offers Received
                  </p>
                  <OffersPanel listingId={listing.id} />
                </div>
              )}

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

      {/* Modals */}
      <BuyConfirmModal
        listing={listing}
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        onSuccess={(id) => setTxnId(id)}
      />
      <MakeOfferModal
        listing={listing}
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
      />
    </>
  );
}
