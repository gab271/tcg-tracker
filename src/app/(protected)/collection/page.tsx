"use client";

import { useState } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { Plus } from "lucide-react";
import TiltCard from "@/components/collection/TiltCard";
import AddCardModal from "@/components/collection/AddCardModal";
import { useCollection, useAddCard } from "@/hooks/use-collection";
import { usePlanLimits } from "@/hooks/use-profile";
import type { CardSearchResult } from "@/types/domain";
import { toast } from "sonner";
import { mapSupabaseError } from "@/lib/errors";

const GAME_TABS = ["All", "Pokémon", "Magic: The Gathering", "One Piece", "Yu-Gi-Oh!"];

export default function CollectionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: collection = [], isLoading } = useCollection(
    activeGame === "All" ? undefined : activeGame
  );
  const addCard = useAddCard();
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

  return (
    <div className="container mx-auto px-6 lg:px-12 py-10 pb-24">
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
        <div className="flex flex-col items-end gap-1 self-start md:self-auto">
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
              {usage.cards}/{limits.maxCards} cards · <span className="underline cursor-pointer hover:text-amber-400">Upgrade to Pro</span>
            </p>
          )}
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
              onClick={() => {
                setSearchTerm("");
                setActiveGame("All");
              }}
              className="mt-4 text-gold-500 text-xs uppercase tracking-wider hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
}
