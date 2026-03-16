"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Loader2, CheckSquare, Square, Trash2, Layers, X } from "lucide-react";
import { Plus } from "lucide-react";
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

const GAME_TABS = ["All", "Pokémon", "Magic: The Gathering", "One Piece", "Yu-Gi-Oh!"];

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
    <div className="container mx-auto px-6 lg:px-12 py-10 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">
            The Vault
          </h1>
          <p className="text-gray-400 text-sm">
            Manage, filter, and view your tracked cards in glorious 3D.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Select mode toggle */}
          {collection.length > 0 && (
            <button
              onClick={() => {
                if (isSelectionMode) exitSelectionMode();
                else setIsSelectionMode(true);
              }}
              className={`px-4 py-2.5 rounded-sm text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-2 border ${
                isSelectionMode
                  ? "bg-vault-700 border-gold-500/40 text-gold-400"
                  : "vault-border bg-vault-800 hover:bg-vault-700 text-gray-400 hover:text-white"
              }`}
            >
              {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {isSelectionMode ? "Selecting" : "Select"}
            </button>
          )}

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => {
                if (isAtCardLimit) {
                  toast.error(`Free plan limit: ${limits.maxCards} cards. Upgrade to Pro for unlimited.`);
                } else {
                  setIsAddModalOpen(true);
                }
              }}
              className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-bold tracking-wider uppercase transition-all vault-glow flex items-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Add Card</span>
            </button>
            {isAtCardLimit && (
              <p className="text-[10px] text-amber-400/70">
                {usage.cards}/{limits.maxCards} cards ·{" "}
                <span className="underline cursor-pointer hover:text-amber-400">Upgrade to Pro</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-vault-800 vault-border rounded-lg p-4 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-vault-900 border border-gray-700 focus:border-gold-500/50 rounded flex items-center h-10 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 outline-none transition-colors"
          />
        </div>

        <div className="flex w-full lg:w-auto items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {GAME_TABS.map((game) => (
            <button
              key={game}
              onClick={() => setActiveGame(game)}
              className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeGame === game
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                  : "bg-vault-900 text-gray-400 border border-gray-800 hover:border-gray-600"
              }`}
            >
              {game}
            </button>
          ))}
          <button className="p-2 bg-vault-900 border border-gray-800 hover:border-gray-600 rounded-md text-gray-400 transition-colors ml-auto lg:ml-2">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selection info bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between mb-5 px-4 py-2.5 bg-vault-800 border border-gold-500/20 rounded-lg"
          >
            <button
              onClick={toggleSelectAll}
              className="text-xs text-gray-400 hover:text-gold-400 transition-colors flex items-center gap-1.5"
            >
              {selectedIds.size === filteredCollection.length && filteredCollection.length > 0
                ? <CheckSquare className="w-3.5 h-3.5" />
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

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : filteredCollection.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
          {filteredCollection.map((card) => (
            <TiltCard
              key={card.id}
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
          ))}
        </div>
      ) : (
        <div className="h-64 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center bg-vault-800/50">
          <Search className="w-8 h-8 text-gray-600 mb-4" />
          <p className="text-gray-400 uppercase tracking-widest text-sm font-medium">
            {collection.length === 0
              ? "Your vault is empty — add your first card!"
              : "No cards found matching your criteria"}
          </p>
          {collection.length > 0 && (
            <button
              onClick={() => { setSearchTerm(""); setActiveGame("All"); }}
              className="mt-4 text-gold-500 text-xs uppercase tracking-wider hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── Floating batch action toolbar ── */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-vault-800 border border-gold-500/30 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)] backdrop-blur-sm"
          >
            <span className="text-xs font-mono font-bold text-gold-400 mr-1">
              {selectedIds.size} card{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="w-px h-5 bg-gray-700" />
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-700 hover:bg-vault-600 text-blue-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Move to Deck
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={deleteBatch.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {deleteBatch.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
            <div className="w-px h-5 bg-gray-700" />
            <button
              onClick={exitSelectionMode}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
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
