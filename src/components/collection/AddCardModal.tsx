"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Plus, Check, Sparkles, AlertCircle } from "lucide-react";
import { useCardSearch } from "@/hooks/use-card-search";
import type { CardSearchResult } from "@/types/domain";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: CardSearchResult) => void;
}

const GAMES = [
  { id: "pokemon",  label: "Pokémon",  featured: "charizard",    emoji: "⚡" },
  { id: "magic",    label: "Magic",    featured: "dragon",        emoji: "🔮" },
  { id: "yugioh",   label: "Yu-Gi-Oh!", featured: "dark magician", emoji: "🌀" },
  { id: "onepiece", label: "One Piece", featured: "luffy",         emoji: "⚓" },
] as const;

type GameId = typeof GAMES[number]["id"];

export default function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [game, setGame] = useState<GameId>("pokemon");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const currentGame = GAMES.find((g) => g.id === game)!;

  const { data: results = [], isFetching, isError } = useCardSearch(searchTerm, game, {
    featuredQuery: currentGame.featured,
  });

  const isShowingFeatured = searchTerm.trim().length < 2;

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setAddedIds(new Set());
    }
  }, [isOpen]);

  // Reset search when switching games
  const handleGameSwitch = (g: GameId) => {
    setGame(g);
    setSearchTerm("");
    setAddedIds(new Set());
  };

  const handleAdd = (card: CardSearchResult) => {
    onAddCard(card);
    setAddedIds((prev) => new Set(prev).add(card.id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] z-[101] flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #0e0e12 0%, #0a0a0e 100%)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "16px",
              boxShadow: "0 0 0 1px rgba(212,175,55,0.06), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.06)",
            }}
          >
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-gold-400 to-amber-600" />
                  <h2 className="text-lg font-bold tracking-[0.12em] uppercase text-white">
                    Add to Vault
                  </h2>
                </div>
                <p className="text-xs text-gray-500 ml-3.5">
                  Search the global card database — prices included
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Game Tabs ── */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="flex gap-1.5 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-fit">
                {GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGameSwitch(g.id)}
                    className={`relative px-4 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all ${
                      game === g.id
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {game === g.id && (
                      <motion.div
                        layoutId="game-tab-bg"
                        className="absolute inset-0 rounded-md"
                        style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{g.emoji} {g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Search Bar ── */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${currentGame.label} cards…`}
                  className="w-full h-12 pl-11 pr-12 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(212,175,55,0.4)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  autoFocus
                />
                {isFetching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-gold-500/60 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Section label ── */}
            {!isFetching && results.length > 0 && (
              <div className="px-6 pb-3 flex-shrink-0 flex items-center gap-2">
                {isShowingFeatured ? (
                  <>
                    <Sparkles className="w-3 h-3 text-gold-500/60" />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-medium">
                      Featured Cards
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-medium">
                    {results.length} results
                  </span>
                )}
              </div>
            )}

            {/* ── Results Grid ── */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {isFetching ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border border-gold-500/20 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-gold-500/60 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full border border-gold-500/10 animate-ping" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-600">Searching…</p>
                </div>
              ) : isError ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-500/40" />
                  <p className="text-xs text-gray-500">API unavailable — try again shortly</p>
                </div>
              ) : results.length === 0 && !isShowingFeatured ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <Search className="w-8 h-8 text-gray-700" />
                  <p className="text-xs text-gray-500">No cards found for &ldquo;{searchTerm}&rdquo;</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {results.map((card, i) => {
                    const isAdded = addedIds.has(card.id);
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="group flex flex-col rounded-xl overflow-hidden cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                        onClick={() => !isAdded && handleAdd(card)}
                      >
                        {/* Card Image */}
                        <div className="relative aspect-[63/88] overflow-hidden bg-black/40">
                          {card.image ? (
                            <img
                              src={card.image}
                              alt={card.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">
                              No Image
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Add / Added button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <motion.div
                              whileTap={{ scale: 0.92 }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xl ${
                                isAdded
                                  ? "bg-green-500"
                                  : "bg-gold-500 hover:bg-gold-400"
                              }`}
                            >
                              {isAdded
                                ? <Check className="w-4 h-4 text-white" />
                                : <Plus className="w-4 h-4 text-black font-bold" />
                              }
                            </motion.div>
                          </div>

                          {/* Added badge */}
                          {isAdded && (
                            <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="p-2.5 flex flex-col gap-0.5">
                          <p className="text-[11px] font-semibold text-white truncate leading-tight">
                            {card.name}
                          </p>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wider truncate">
                            {card.rarity}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            {card.price > 0 ? (
                              <span className="text-[11px] font-bold font-mono text-gold-400">
                                €{card.price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-700">—</span>
                            )}
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium"
                              style={{ background: "rgba(212,175,55,0.08)", color: "rgba(212,175,55,0.5)" }}
                            >
                              {card.game}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div
              className="px-6 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-[10px] text-gray-700">
                {game === "pokemon" && "Data · PokémonTCG.io · Cardmarket prices"}
                {game === "magic"   && "Data · Scryfall · Market prices"}
                {game === "yugioh" && "Data · YGOPRODeck · Cardmarket prices"}
                {game === "onepiece" && "Data · Bandai · Prices not available"}
              </p>
              <p className="text-[10px] text-gray-700">
                Click a card to add it to your vault
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
