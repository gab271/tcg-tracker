"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Plus, Check } from "lucide-react";
import { logger } from "@/lib/logger";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: any) => void;
}

export default function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  
  // Debounce ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setAddedIds(new Set());
    }
  }, [isOpen]);

  // Pokemon TCG API search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        // Querying Pokemon TCG API
        const query = encodeURIComponent(`name:"*${searchTerm}*"`);
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=20`);
        const data = await res.json();
        
        if (data && data.data) {
          const formattedResults = data.data.map((card: any) => ({
            id: card.id,
            name: card.name,
            image: card.images.small,
            game: "Pokémon",
            rarity: card.rarity || "Common",
            price: card.cardmarket?.prices?.averageSellPrice || 0,
            quantity: 1
          }));
          setResults(formattedResults);
        } else {
          setResults([]);
        }
      } catch (err) {
        logger.error("Failed to search cards", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchTerm]);

  const handleAdd = (card: any) => {
    onAddCard(card);
    setAddedIds(prev => new Set(prev).add(card.id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[85vh] z-[101] p-0 bg-vault-900 border vault-border rounded-xl shadow-2xl vault-glow flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-800 flex justify-between items-center bg-vault-800/50">
              <div>
                <h2 className="text-xl font-bold tracking-wider uppercase text-gold-gradient mb-1">
                  Add to Vault
                </h2>
                <p className="text-xs text-gray-400">Search the global database to add cards to your collection.</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 bg-vault-900 rounded-full border border-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 py-4 bg-vault-900 border-b border-gray-800 relative z-10 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Pokémon name (e.g. Charizard, Pikachu)..."
                  className="w-full bg-vault-800 border-2 border-gray-800 focus:border-gold-500/50 rounded-lg flex items-center h-14 pl-12 pr-4 text-white placeholder:text-gray-500 outline-none transition-all vault-glow-focus text-lg"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500 animate-spin" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6 bg-vault-900">
              {searchTerm && !isSearching && results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="uppercase tracking-widest text-sm font-medium mb-1">No cards found</p>
                  <p className="text-xs">Try adjusting your search terms.</p>
                </div>
              ) : !searchTerm ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                  <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center mb-4 bg-vault-800">
                    <Search className="w-6 h-6 text-gold-500/30" />
                  </div>
                  <p className="uppercase tracking-widest text-sm font-medium">Type to search</p>
                  <p className="text-xs mt-2 text-center max-w-xs">Connecting to Pokémon TCG API Database...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((card) => {
                    const isAdded = addedIds.has(card.id);
                    return (
                      <div key={card.id} className="bg-vault-800 rounded-lg p-3 border border-gray-800 hover:border-gold-500/30 transition-all group flex flex-col">
                        <div className="relative aspect-[63/88] mb-3 w-full bg-vault-900 rounded overflow-hidden">
                          {card.image ? (
                            <img src={card.image} alt={card.name} className="w-full h-full object-contain" loading="lazy" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">No Image</div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
                             <p className="text-xs font-bold text-white truncate">{card.name}</p>
                             <p className="text-[10px] text-gray-300 truncate">{card.rarity}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-gold-400 font-mono font-bold text-xs">${card.price.toFixed(2)}</span>
                          <button
                            disabled={isAdded}
                            onClick={() => handleAdd(card)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isAdded 
                                ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed" 
                                : "bg-vault-900 text-gold-400 border border-gold-500/30 hover:bg-gold-500/10"
                            }`}
                          >
                            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-vault-800 text-center text-xs text-gray-500">
              Data provided by Pokémon TCG API. Market prices from Cardmarket.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
