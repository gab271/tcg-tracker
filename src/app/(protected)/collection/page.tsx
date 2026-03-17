"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Loader2, CheckSquare, Square, Trash2, Layers, X, Plus, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "@/components/collection/TiltCard";
import AddCardModal from "@/components/collection/AddCardModal";
import MoveToDeckModal from "@/components/collection/MoveToDeckModal";
import { useCollection, useAddCard, useDeleteCardsBatch, useMoveToDeck } from "@/hooks/use-collection";
import { usePlanLimits } from "@/hooks/use-profile";
import { useDecks } from "@/hooks/use-decks";
import type { CardSearchResult } from "@/types/domain";
import { toast } from "sonner";
import { mapSupabaseError } from "@/lib/errors";

const GAME_TABS = [
  { id: "All", label: "All" },
  { id: "Pokémon", label: "Pokémon" },
  { id: "Magic: The Gathering", label: "Magic" },
  { id: "One Piece", label: "One Piece" },
  { id: "Yu-Gi-Oh!", label: "Yu-Gi-Oh!" },
];

export default function CollectionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const { data: collection = [], isLoading } = useCollection(
    activeGame === "All" ? undefined : activeGame
  );
  const { data: decks = [] } = useDecks();
  const addCard = useAddCard();
  const deleteBatch = useDeleteCardsBatch();
  const moveToDeck = useMoveToDeck();
  const { canAddCard, isAtCardLimit, limits, usage } = usePlanLimits();

  const filteredCollection = collection.filter((card) =>
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Computed stats
  const stats = useMemo(() => {
    const totalValue = collection.reduce((sum, c) => sum + (c.price ?? 0) * (c.quantity ?? 1), 0);
    const totalCards = collection.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
    const uniqueCards = collection.length;
    return { totalValue, totalCards, uniqueCards };
  }, [collection]);

  const handleAddCard = async (card: CardSearchResult) => {
    if (!canAddCard) {
      toast.error(`Free plan limit: ${limits.maxCards} cards. Upgrade to Pro for unlimited.`);
      return;
    }
    try {
      await addCard.mutateAsync({
        cardId: card.id,
        name: card.name,
        image: card.image,
        game: card.game,
        rarity: card.rarity,
        price: card.price,
        quantity: 1,
      });
      toast.success(`${card.name} added to your vault!`);
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCollection.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCollection.map((c) => c.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteBatch.mutateAsync([...selectedIds]);
      toast.success(`Deleted ${selectedIds.size} card${selectedIds.size !== 1 ? "s" : ""} from vault.`);
      exitSelectionMode();
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  const handleMoveSelected = async (deckId: string) => {
    const selectedCards = filteredCollection
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({
        cardId: c.card_id,
        name: c.card_name,
        image: c.card_image,
        price: c.price,
      }));

    try {
      const result = await moveToDeck.mutateAsync({ deckId, cards: selectedCards });
      const msg = result.skipped > 0
        ? `Added ${result.added} card${result.added !== 1 ? "s" : ""} (${result.skipped} already in deck).`
        : `Added ${result.added} card${result.added !== 1 ? "s" : ""} to deck.`;
      toast.success(msg);
      setIsMoveModalOpen(false);
      exitSelectionMode();
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Page Header ── */}
      <div
        className="border-b border-white/[0.06]"
        style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.04) 0%, transparent 100%)" }}
      >
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Title + Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gold-400 to-amber-700" />
                <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
                  The Vault
                </h1>
              </div>

              {/* Stat Pills */}
              {collection.length > 0 && (
                <div className="flex items-center gap-3 ml-3">
                  <StatPill label="Cards" value={stats.totalCards.toString()} />
                  <div className="w-px h-3 bg-white/10" />
                  <StatPill label="Unique" value={stats.uniqueCards.toString()} />
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-gold-500/60" />
                    <StatPill
                      label="Value"
                      value={`€${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      accent
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {collection.length > 0 && (
                <button
                  onClick={() => {
                    if (isSelectionMode) exitSelectionMode();
                    else setIsSelectionMode(true);
                  }}
                  className={`h-9 px-4 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                    isSelectionMode
                      ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                      : "bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {isSelectionMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {isSelectionMode ? "Selecting" : "Select"}
                </button>
              )}

              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => {
                    if (isAtCardLimit) {
                      toast.error(`Free plan limit: ${limits.maxCards} cards. Upgrade to Pro.`);
                    } else {
                      setIsAddModalOpen(true);
                    }
                  }}
                  className="h-9 px-5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    color: "#d4af37",
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.12) 100%)" }}
                  />
                  <Plus className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Add Card</span>
                </button>
                {isAtCardLimit && (
                  <p className="text-[10px] text-amber-500/60">
                    {usage.cards}/{limits.maxCards} ·{" "}
                    <span className="underline cursor-pointer hover:text-amber-400">Upgrade</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-8 pb-32">
        {/* ── Filters Bar ── */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="text"
              placeholder="Filter your collection…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg text-sm text-white placeholder:text-gray-600 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {/* Game Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {GAME_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGame(tab.id)}
                className={`h-10 px-4 rounded-lg text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 ${
                  activeGame === tab.id
                    ? "text-gold-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                style={activeGame === tab.id ? {
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.25)",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Selection Bar ── */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-between mb-5 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
            >
              <button
                onClick={toggleSelectAll}
                className="text-xs text-gray-400 hover:text-gold-400 transition-colors flex items-center gap-1.5"
              >
                {selectedIds.size === filteredCollection.length && filteredCollection.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-gold-400" />
                  : <Square className="w-3.5 h-3.5" />}
                {selectedIds.size === filteredCollection.length && filteredCollection.length > 0
                  ? "Deselect All"
                  : `Select All (${filteredCollection.length})`}
              </button>
              <span className="text-xs text-gold-400 font-mono font-bold">
                {selectedIds.size} selected
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border border-gold-500/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gold-500/50" />
              </div>
              <div className="absolute inset-0 rounded-full border border-gold-500/10 animate-ping" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-600">Loading vault…</p>
          </div>
        ) : filteredCollection.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 lg:gap-6">
            {filteredCollection.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
              >
                <TiltCard
                  card={{
                    id: card.id,
                    name: card.card_name,
                    image: card.card_image ?? "",
                    price: card.price,
                    quantity: card.quantity,
                    game: card.game,
                    rarity: card.rarity,
                  }}
                  selectable={isSelectionMode}
                  selected={selectedIds.has(card.id)}
                  onToggleSelect={toggleSelect}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {collection.length === 0
                ? <Plus className="w-6 h-6 text-gray-700" />
                : <Search className="w-6 h-6 text-gray-700" />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">
                {collection.length === 0 ? "Your vault is empty" : "No cards match"}
              </p>
              <p className="text-xs text-gray-700">
                {collection.length === 0
                  ? "Add your first card to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
            {collection.length === 0 ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 px-5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2"
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  color: "#d4af37",
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Card
              </button>
            ) : (
              <button
                onClick={() => { setSearchTerm(""); setActiveGame("All"); }}
                className="text-xs text-gold-500/60 hover:text-gold-400 transition-colors uppercase tracking-wider"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Batch Toolbar ── */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl backdrop-blur-xl"
            style={{
              background: "rgba(12,12,16,0.92)",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.08)",
            }}
          >
            <span className="text-xs font-mono font-bold text-gold-400 px-1">
              {selectedIds.size}
            </span>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <Layers className="w-3.5 h-3.5" />
              Move to Deck
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={deleteBatch.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              {deleteBatch.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={exitSelectionMode} className="text-gray-600 hover:text-gray-400 transition-colors p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={handleAddCard}
      />

      <MoveToDeckModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        decks={decks}
        selectedCount={selectedIds.size}
        isPending={moveToDeck.isPending}
        onMove={handleMoveSelected}
      />
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-bold font-mono ${accent ? "text-gold-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}
