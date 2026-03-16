"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Check, Loader2 } from "lucide-react";
import type { DeckRow } from "@/lib/supabase/queries/decks";

interface MoveToDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: DeckRow[];
  selectedCount: number;
  isPending: boolean;
  onMove: (deckId: string) => void;
}

export default function MoveToDeckModal({
  isOpen,
  onClose,
  decks,
  selectedCount,
  isPending,
  onMove,
}: MoveToDeckModalProps) {
  const [pickedDeckId, setPickedDeckId] = useState<string | null>(null);

  const handleMove = () => {
    if (!pickedDeckId) return;
    onMove(pickedDeckId);
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
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] bg-vault-900 border vault-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-vault-800/50">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider text-gold-gradient">
                  Move to Deck
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adding {selectedCount} card{selectedCount !== 1 ? "s" : ""} to a deck
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deck list */}
            <div className="p-4 max-h-72 overflow-y-auto space-y-2">
              {decks.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  No decks yet. Create a deck first.
                </p>
              ) : (
                decks.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => setPickedDeckId(deck.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      pickedDeckId === deck.id
                        ? "border-gold-500/50 bg-gold-500/8 text-white"
                        : "border-gray-800 bg-vault-800 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-gold-500/50 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{deck.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{deck.game}</p>
                      </div>
                    </div>
                    {pickedDeckId === deck.id && (
                      <Check className="w-4 h-4 text-gold-400 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={!pickedDeckId || isPending}
                className="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-vault-900 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Move to Deck
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
