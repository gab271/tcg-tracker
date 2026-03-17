"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, X, ChevronRight, Search, Edit3, Check } from "lucide-react";
import { toast } from "sonner";
import { useWishlist, useRemoveFromWishlist, useUpdateWishlistMaxPrice } from "@/hooks/use-wishlist";
import type { DbWishlistItem } from "@/types/database";

const GAME_COLORS: Record<string, string> = {
  "Pokémon":              "#ef4444",
  "Magic: The Gathering": "#3b82f6",
  "One Piece":            "#eab308",
  "Yu-Gi-Oh!":            "#a855f7",
};

const GAME_SYMBOLS: Record<string, string> = {
  "Pokémon":              "⚡",
  "Magic: The Gathering": "✦",
  "One Piece":            "☠",
  "Yu-Gi-Oh!":            "★",
};

function WishlistItem({ item }: { item: DbWishlistItem }) {
  const [editing, setEditing]   = useState(false);
  const [price, setPrice]       = useState(item.max_price?.toString() ?? "");
  const { mutateAsync: remove, isPending: removing } = useRemoveFromWishlist();
  const { mutateAsync: updatePrice, isPending: saving } = useUpdateWishlistMaxPrice();

  const color = GAME_COLORS[item.game] ?? "#d4af37";

  const handleRemove = async () => {
    try {
      await remove({ itemId: item.id, cardId: item.card_id });
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleSavePrice = async () => {
    const val = price.trim() === "" ? null : parseFloat(price);
    if (val !== null && (isNaN(val) || val <= 0)) {
      toast.error("Enter a valid price or leave blank");
      return;
    }
    try {
      await updatePrice({ itemId: item.id, maxPrice: val });
      setEditing(false);
      toast.success("Max price updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 bg-vault-800/60 border border-gray-700/40 rounded-2xl hover:border-gray-600/50 transition-colors group"
    >
      {/* Card image */}
      <div
        className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center relative"
        style={{ borderColor: `${color}30`, background: `${color}08` }}
      >
        {item.card_image ? (
          <Image src={item.card_image} alt={item.card_name} fill className="object-contain p-1" sizes="56px" />
        ) : (
          <span className="text-xl opacity-20">{GAME_SYMBOLS[item.game] ?? "◈"}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{item.card_name}</p>
        <span
          className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5"
          style={{ color, background: `${color}18` }}
        >
          {GAME_SYMBOLS[item.game]} {item.game}
        </span>

        {/* Max price */}
        <div className="flex items-center gap-2 mt-1.5">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gold-400 text-xs">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="No limit"
                  className="w-28 pl-5 pr-2 py-1 bg-vault-700 border border-gray-600 focus:border-gold-500 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSavePrice()}
                />
              </div>
              <button
                onClick={handleSavePrice}
                disabled={saving}
                className="w-6 h-6 rounded-md bg-green-500/15 border border-green-500/30 text-green-400 flex items-center justify-center hover:bg-green-500/25 transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setEditing(false); setPrice(item.max_price?.toString() ?? ""); }}
                className="w-6 h-6 rounded-md bg-white/5 border border-gray-700 text-gray-500 flex items-center justify-center hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors group/edit"
            >
              <Edit3 className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
              {item.max_price != null
                ? <span>Max price: <span className="text-gold-400 font-mono">€{Number(item.max_price).toFixed(2)}</span></span>
                : <span>Set max price</span>}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/market?q=${encodeURIComponent(item.card_name)}&game=${encodeURIComponent(item.game)}`}
          className="p-2 rounded-lg bg-white/3 border border-gray-700/40 text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
          title="Search in Market"
        >
          <Search className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleRemove}
          disabled={removing}
          title="Remove from wishlist"
          className="p-2 rounded-lg bg-white/3 border border-gray-700/40 text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const { data: items, isLoading } = useWishlist();
  const [search, setSearch] = useState("");

  const filtered = (items ?? []).filter((item) =>
    item.card_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-vault-900">
      <div className="max-w-3xl mx-auto py-10 px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 fill-red-500 text-red-500" />
            <h1 className="font-display text-2xl font-bold text-white">Wishlist</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Cards you&apos;re looking for.{" "}
            {items && items.length > 0 && (
              <span className="text-gray-400">{items.length} card{items.length !== 1 ? "s" : ""}</span>
            )}
          </p>
        </motion.div>

        {/* Search */}
        {items && items.length > 4 && (
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wishlist…"
              className="w-full pl-10 pr-4 py-2.5 bg-vault-800 border border-gray-700/50 focus:border-gray-500 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-vault-800/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 && !search ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">Your wishlist is empty</p>
            <p className="text-gray-600 text-sm mb-5">
              Add cards from the market to track them here
            </p>
            <Link
              href="/market"
              className="inline-flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors"
            >
              Browse Market <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No results for &ldquo;{search}&rdquo;</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <WishlistItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
