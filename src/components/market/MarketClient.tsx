"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Tag, X, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMarketListings } from "@/hooks/use-market";
import { useQueryClient } from "@tanstack/react-query";
import ListingCard from "./ListingCard";
import ListCardModal from "./ListCardModal";
import type { DbMarketListing } from "@/types/database";

const GAMES = [
  { label: "All Games",             value: "",                   color: "#d4af37", symbol: "◈" },
  { label: "Pokémon",               value: "Pokémon",            color: "#ef4444", symbol: "⚡" },
  { label: "Magic: The Gathering",  value: "Magic: The Gathering", color: "#3b82f6", symbol: "✦" },
  { label: "One Piece",             value: "One Piece",          color: "#eab308", symbol: "☠" },
  { label: "Yu-Gi-Oh!",             value: "Yu-Gi-Oh!",          color: "#a855f7", symbol: "★" },
];

const CONDITIONS = [
  { label: "Mint",      value: "mint",      color: "#22d3ee" },
  { label: "Near Mint", value: "near_mint", color: "#4ade80" },
  { label: "Played",    value: "played",    color: "#facc15" },
  { label: "Damaged",   value: "damaged",   color: "#f87171" },
];

const RARITIES = ["Common", "Uncommon", "Rare", "Holo Rare", "Ultra Rare", "Secret Rare", "Full Art"];

interface MarketClientProps {
  initialListings: DbMarketListing[];
}

export default function MarketClient({ initialListings }: MarketClientProps) {
  const queryClient = useQueryClient();

  // Filters state
  const [selectedGame, setSelectedGame]         = useState("");
  const [selectedConditions, setSelectedConds]  = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [minPrice, setMinPrice]                 = useState("");
  const [maxPrice, setMaxPrice]                 = useState("");
  const [filtersOpen, setFiltersOpen]           = useState(false);
  const [listModalOpen, setListModalOpen]       = useState(false);
  const [newIds, setNewIds]                     = useState<Set<string>>(new Set());

  const filters = useMemo(() => ({
    game:       selectedGame      || undefined,
    condition:  selectedConditions.length === 1 ? selectedConditions[0] : undefined,
    minPrice:   minPrice          ? parseFloat(minPrice)  : undefined,
    maxPrice:   maxPrice          ? parseFloat(maxPrice)  : undefined,
  }), [selectedGame, selectedConditions, minPrice, maxPrice]);

  const { data: listings = initialListings, isLoading } = useMarketListings(filters);

  // Client-side multi-condition filtering (when >1 condition selected)
  const displayListings = useMemo(() => {
    if (selectedConditions.length <= 1 && selectedRarities.length === 0) return listings;
    return listings.filter((l) => {
      const condOk = selectedConditions.length === 0 || selectedConditions.includes(l.condition);
      const rarOk  = selectedRarities.length === 0   || selectedRarities.includes(l.rarity ?? "");
      return condOk && rarOk;
    });
  }, [listings, selectedConditions, selectedRarities]);

  const activeGame = GAMES.find((g) => g.value === selectedGame) ?? GAMES[0];

  // ── Supabase Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("market_listings_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_listings" },
        (payload: { new: DbMarketListing }) => {
          const newRow = payload.new;
          setNewIds((prev) => new Set([...prev, newRow.id]));
          queryClient.invalidateQueries({ queryKey: ["market-listings"] });
          // Clear "new" badge after 2 minutes
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(newRow.id);
              return next;
            });
          }, 1000 * 120);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "market_listings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["market-listings"] });
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  const toggleCondition = useCallback((val: string) => {
    setSelectedConds((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }, []);

  const toggleRarity = useCallback((val: string) => {
    setSelectedRarities((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  }, []);

  const activeFiltersCount =
    (selectedGame ? 1 : 0) +
    selectedConditions.length +
    selectedRarities.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedGame("");
    setSelectedConds([]);
    setSelectedRarities([]);
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="relative min-h-screen">
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#080a0d]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='%23d4af37'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-gold-500/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto py-8 px-5 lg:px-10">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8"
        >
          <div>
            <p className="text-[9px] font-bold text-gold-400/60 uppercase tracking-[0.25em] mb-1.5">
              Vault · The Exchange
            </p>
            <h1 className="font-display text-4xl font-bold text-white tracking-wide">
              Market
            </h1>
            <p className="text-gray-600 text-sm mt-1.5">
              {displayListings.length} listing{displayListings.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wide">
                Live
              </span>
            </div>

            {/* Mobile filter toggle */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFiltersOpen((o) => !o)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/4 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold-500 text-vault-900 text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>

            {/* List a card CTA */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setListModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              <Tag className="w-3.5 h-3.5" />
              List a Card
            </motion.button>
          </div>
        </motion.div>

        {/* ── GAME TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex gap-1.5 overflow-x-auto pb-1 mb-7"
        >
          {GAMES.map((g) => {
            const isActive = selectedGame === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setSelectedGame(g.value)}
                className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive ? `${g.color}12` : "transparent",
                  border:     isActive ? `1px solid ${g.color}35` : "1px solid transparent",
                  color:      isActive ? g.color : "#6b7280",
                }}
              >
                {isActive && (
                  <motion.span layoutId="market-tab-sym" className="text-xs" style={{ color: g.color }}>
                    {g.symbol}
                  </motion.span>
                )}
                {g.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── LAYOUT: SIDEBAR + GRID ── */}
        <div className="flex gap-6">

          {/* ── SIDEBAR (desktop always visible, mobile collapsible) ── */}
          <AnimatePresence>
            {(filtersOpen || true) && ( // always rendered on desktop, toggled on mobile
              <motion.aside
                initial={false}
                className={`
                  flex-shrink-0 w-56
                  ${filtersOpen ? "block" : "hidden"} md:block
                `}
              >
                <div className="sticky top-24 space-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Filters</p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear all
                      </button>
                    )}
                  </div>

                  <FilterSection title="Condition">
                    {CONDITIONS.map((c) => (
                      <FilterCheckbox
                        key={c.value}
                        label={c.label}
                        color={c.color}
                        checked={selectedConditions.includes(c.value)}
                        onChange={() => toggleCondition(c.value)}
                      />
                    ))}
                  </FilterSection>

                  <FilterSection title="Price Range">
                    <div className="flex gap-2 pt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">€</span>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="Min"
                          min="0"
                          className="w-full bg-[#0a0c10] border border-white/8 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-gold-500/30 transition-colors"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">€</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="Max"
                          min="0"
                          className="w-full bg-[#0a0c10] border border-white/8 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-gold-500/30 transition-colors"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection title="Rarity">
                    {RARITIES.map((r) => (
                      <FilterCheckbox
                        key={r}
                        label={r}
                        checked={selectedRarities.includes(r)}
                        onChange={() => toggleRarity(r)}
                      />
                    ))}
                  </FilterSection>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── MAIN GRID ── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-vault-800/40 border border-white/4 overflow-hidden">
                    <div className="aspect-[3/4] bg-vault-700/40 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-vault-700/40 rounded animate-pulse w-3/4" />
                      <div className="h-2 bg-vault-700/30 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayListings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-28"
              >
                <div className="relative w-24 h-32 mb-6">
                  {[
                    { rotate: -10, x: -20, opacity: 0.1 },
                    { rotate: -4,  x: -10, opacity: 0.2 },
                    { rotate: 0,   x: 0,   opacity: 0.35 },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-xl border border-gold-500/20"
                      style={{
                        background: "linear-gradient(155deg, #1c1810, #0f1115)",
                        transform: `rotate(${s.rotate}deg) translateX(${s.x}px)`,
                        opacity: s.opacity,
                        zIndex: i + 1,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-3xl text-gold-500/20">
                        {activeGame.symbol}
                      </div>
                    </div>
                  ))}
                </div>
                <h2 className="font-display text-xl font-bold text-white mb-2">No listings found</h2>
                <p className="text-gray-600 text-sm mb-6 max-w-xs">
                  {activeFiltersCount > 0
                    ? "Try adjusting your filters to find what you're looking for."
                    : "Be the first to list a card on the market."}
                </p>
                {activeFiltersCount > 0 ? (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gold-500/70 hover:text-gold-400 transition-colors"
                  >
                    Clear filters
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setListModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    List Your First Card
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {displayListings.map((listing, i) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isNew={newIds.has(listing.id)}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ListCardModal isOpen={listModalOpen} onClose={() => setListModalOpen(false)} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-white/6 pb-4 mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3 h-3 text-gray-700" />
        ) : (
          <ChevronDown className="w-3 h-3 text-gray-700" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterCheckbox({
  label,
  color,
  checked,
  onChange,
}: {
  label: string;
  color?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer group">
      <div
        className="relative w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-150"
        style={{
          background:  checked ? (color ?? "#d4af37") + "30" : "transparent",
          borderColor: checked ? (color ?? "#d4af37") : "rgba(255,255,255,0.12)",
        }}
        onClick={onChange}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2 h-2" fill="none">
            <path d="M1 4l3 3 5-6" stroke={color ?? "#d4af37"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className="text-[11px] transition-colors"
        style={{ color: checked ? (color ?? "#d4af37") : "#6b7280" }}
        onClick={onChange}
      >
        {label}
      </span>
    </label>
  );
}
