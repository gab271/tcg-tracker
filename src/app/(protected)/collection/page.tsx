"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Loader2, CheckSquare, Square, Trash2, Layers, X, Plus, TrendingUp, Zap, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "@/components/collection/TiltCard";
import AddCardModal from "@/components/collection/AddCardModal";
import MoveToDeckModal from "@/components/collection/MoveToDeckModal";
import { useCollection, useAddCard, useDeleteCardsBatch, useMoveToDeck } from "@/hooks/use-collection";
import { usePlanLimits } from "@/hooks/use-profile";
import { useDecks } from "@/hooks/use-decks";
import { useSetCompletion } from "@/hooks/use-set-completion";
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

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "recent";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",     label: "Más reciente"  },
  { value: "price_desc", label: "Mayor precio"  },
  { value: "price_asc",  label: "Menor precio"  },
  { value: "name_asc",   label: "Nombre A-Z"    },
  { value: "name_desc",  label: "Nombre Z-A"    },
];

export default function CollectionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtros avanzados
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [filterRarity, setFilterRarity] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
  const router = useRouter();
  const { completion: setCompletion } = useSetCompletion(collection, activeGame);

  // Extraer rarities únicas de la colección actual
  const rarities = useMemo(() => {
    const set = new Set(collection.map((c) => c.rarity).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [collection]);

  const filteredCollection = useMemo(() => {
    let result = collection.filter((card) => {
      if (!card.card_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterRarity !== "All" && card.rarity !== filterRarity) return false;
      if (minPrice && card.price < parseFloat(minPrice)) return false;
      if (maxPrice && card.price > parseFloat(maxPrice)) return false;
      return true;
    });

    // Ordenar
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "price_desc": return (b.price ?? 0) - (a.price ?? 0);
        case "price_asc":  return (a.price ?? 0) - (b.price ?? 0);
        case "name_asc":   return a.card_name.localeCompare(b.card_name);
        case "name_desc":  return b.card_name.localeCompare(a.card_name);
        default:           return 0; // "recent" — mantiene orden de BD (created_at desc)
      }
    });

    return result;
  }, [collection, searchTerm, filterRarity, minPrice, maxPrice, sortKey]);

  const activeFilterCount = [
    filterRarity !== "All",
    minPrice !== "",
    maxPrice !== "",
    sortKey !== "recent",
  ].filter(Boolean).length;

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
                  <button
                    onClick={() => router.push("/pricing")}
                    className="flex items-center gap-1 text-[10px] text-amber-500/70 hover:text-amber-400 transition-colors"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {usage.cards}/{limits.maxCards} · Upgrade to Pro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-8 pb-32">
        {/* ── Filters Bar ── */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
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
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {GAME_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGame(tab.id)}
                className={`h-10 px-4 rounded-lg text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all flex-shrink-0 ${
                  activeGame === tab.id ? "text-gold-400" : "text-gray-500 hover:text-gray-300"
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

          {/* Sort & Filter toggle */}
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-10 pl-3 pr-8 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 appearance-none cursor-pointer outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0d0f14]">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 relative"
              style={showFilters || activeFilterCount > 0 ? {
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#d4af37",
              } : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6b7280",
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gold-500 text-vault-900 text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Advanced Filters Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div
                className="p-4 rounded-xl flex flex-wrap gap-5 items-end"
                style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}
              >
                {/* Rarity */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                    Rarity
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {rarities.map((r) => (
                      <button
                        key={r}
                        onClick={() => setFilterRarity(r)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                        style={filterRarity === r ? {
                          background: "rgba(212,175,55,0.15)",
                          border: "1px solid rgba(212,175,55,0.4)",
                          color: "#d4af37",
                        } : {
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "#6b7280",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                    Price range (€)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg text-xs text-white placeholder:text-gray-700 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <span className="text-gray-700 text-xs">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg text-xs text-white placeholder:text-gray-700 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterRarity("All"); setMinPrice(""); setMaxPrice(""); setSortKey("recent"); }}
                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* ── Set Completion (Pokémon) ── */}
        {setCompletion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-red-500" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Set Completion</p>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-950/60 text-red-400 border border-red-800/40">
                  Pokémon
                </span>
              </div>
              <p className="text-[10px] text-gray-600">{setCompletion.length} set{setCompletion.length !== 1 ? "s" : ""} in progress</p>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {setCompletion.slice(0, 6).map((s) => (
                <div key={s.setId} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.045] transition-colors">
                  {s.logoUrl && (
                    <img src={s.logoUrl} alt={s.setName} className="w-8 h-8 object-contain shrink-0 opacity-80" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-white truncate">{s.setName}</p>
                      <p className="text-[10px] font-mono text-gray-500 shrink-0">
                        {s.owned}/{s.total}
                      </p>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: s.pct >= 80 ? "#4ade80" : s.pct >= 50 ? "#facc15" : "#ef4444",
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-700 mt-1">{s.pct}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
