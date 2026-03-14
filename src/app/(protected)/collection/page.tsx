"use client";

import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import TiltCard from "@/components/collection/TiltCard";
import AddCardModal from "@/components/collection/AddCardModal";

// Mock data — IDs match the detail page routes, images are real
const MOCK_COLLECTION = [
  {
    id: "charizard",
    name: "Charizard",
    image: "https://images.pokemontcg.io/base1/4_hires.png",
    price: 350.50,
    quantity: 1,
    game: "Pokémon",
    rarity: "Holo Rare",
  },
  {
    id: "black-lotus",
    name: "Black Lotus",
    image: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838",
    price: 15400.00,
    quantity: 1,
    game: "Magic: The Gathering",
    rarity: "Rare",
  },
  {
    id: "umbreon-vmax",
    name: "Umbreon VMAX",
    image: "https://images.pokemontcg.io/swsh7/215_hires.png",
    price: 580.00,
    quantity: 1,
    game: "Pokémon",
    rarity: "Secret Rare",
  },
  {
    id: "luffy-manga",
    name: "Monkey D. Luffy",
    image: "https://images.pokemontcg.io/base1/58.png",
    price: 1200.00,
    quantity: 2,
    game: "One Piece",
    rarity: "Manga Rare",
  },
  {
    id: "blue-eyes",
    name: "Blue-Eyes White Dragon",
    image: "https://images.pokemontcg.io/base1/2_hires.png",
    price: 150.00,
    quantity: 3,
    game: "Yu-Gi-Oh!",
    rarity: "Ultra Rare",
  },
  {
    id: "shanks",
    name: "Shanks",
    image: "https://images.pokemontcg.io/base1/15.png",
    price: 850.00,
    quantity: 1,
    game: "One Piece",
    rarity: "Manga Rare",
  },
  {
    id: "mox-sapphire",
    name: "Mox Sapphire",
    image: "https://cards.scryfall.io/large/front/e/a/ea1feac0-d3a7-45eb-9719-1cdbb84b15c5.jpg?1614638862",
    price: 4200.00,
    quantity: 1,
    game: "Magic: The Gathering",
    rarity: "Rare",
  },
  {
    id: "pikachu-illustrator",
    name: "Pikachu Illustrator",
    image: "https://images.pokemontcg.io/base1/58.png",
    price: 250000.00,
    quantity: 1,
    game: "Pokémon",
    rarity: "Promo",
  },
];

export default function CollectionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [collection, setCollection] = useState(MOCK_COLLECTION);

  const filteredCollection = collection.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = activeGame === "All" || card.game === activeGame;
    return matchesSearch && matchesGame;
  });

  const handleAddCard = (card: any) => {
    const exists = collection.find(c => c.id === card.id);
    if (!exists) {
      setCollection(prev => [
        {
          id: card.id,
          name: card.name,
          image: card.image,
          price: card.price,
          quantity: 1,
          game: card.game || "Pokémon",
          rarity: card.rarity || "Common",
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="container mx-auto px-6 lg:px-12 py-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">The Vault</h1>
          <p className="text-gray-400 text-sm">Manage, filter, and view your tracked cards in glorious 3D.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-bold tracking-wider uppercase transition-all vault-glow flex items-center gap-2 group relative overflow-hidden self-start md:self-auto"
        >
          <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
          <Plus className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Add Card</span>
        </button>
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
          {["All", "Pokémon", "Magic: The Gathering", "One Piece", "Yu-Gi-Oh!"].map((game) => (
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
      {filteredCollection.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
          {filteredCollection.map((card) => (
            <TiltCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="h-64 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center bg-vault-800/50">
          <Search className="w-8 h-8 text-gray-600 mb-4" />
          <p className="text-gray-400 uppercase tracking-widest text-sm font-medium">No cards found matching your criteria</p>
          <button
            onClick={() => { setSearchTerm(""); setActiveGame("All"); }}
            className="mt-4 text-gold-500 text-xs uppercase tracking-wider hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
}
