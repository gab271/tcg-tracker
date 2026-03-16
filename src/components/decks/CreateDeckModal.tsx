"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateDeck } from "@/hooks/use-decks";
import { toast } from "sonner";
import { mapSupabaseError } from "@/lib/errors";

const GAMES = [
  { name: "Pokémon", color: "#EF4444" },
  { name: "Magic: The Gathering", color: "#3B82F6" },
  { name: "One Piece", color: "#EAB308" },
  { name: "Yu-Gi-Oh!", color: "#8B5CF6" },
];

const FORMATS = ["Standard", "Expanded", "Unlimited"];

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateDeckModal({ isOpen, onClose, onSuccess }: CreateDeckModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("Pokémon");
  const [format, setFormat] = useState("Standard");

  const createDeck = useCreateDeck();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createDeck.mutateAsync({ name: name.trim(), description, game, format });
      setName("");
      setDescription("");
      setGame("Pokémon");
      setFormat("Standard");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#121212] border border-gray-800 p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 my-8 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <h2 className="text-2xl font-extrabold text-white mb-6">Create New Deck</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Select Game
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {GAMES.map((g) => {
                    const isSelected = game === g.name;
                    return (
                      <motion.div
                        key={g.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGame(g.name)}
                        className={`cursor-pointer relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                          isSelected
                            ? "bg-[#1a1a1a] shadow-[0_0_15px_rgba(212,160,23,0.15)]"
                            : "bg-[#0a0a0a] border-gray-800 hover:border-gray-600"
                        }`}
                        style={{ borderColor: isSelected ? "#D4A017" : undefined }}
                      >
                        <div
                          className="absolute inset-0 z-0 opacity-10 rounded-xl pointer-events-none"
                          style={{
                            background: `linear-gradient(to bottom right, ${g.color}, transparent)`,
                          }}
                        />
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10"
                          style={{
                            backgroundColor: g.color + "40",
                            color: g.color,
                            border: `1px solid ${g.color}60`,
                          }}
                        >
                          {g.name === "Magic: The Gathering"
                            ? "MTG"
                            : g.name.substring(0, 3).toUpperCase()}
                        </div>
                        <span
                          className={`text-sm font-medium z-10 text-center ${
                            isSelected ? "text-[#D4A017]" : "text-gray-300"
                          }`}
                        >
                          {g.name}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Name & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Charizard ex"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all appearance-none"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description{" "}
                  <span className="text-gray-600 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about strategy, missing cards, etc..."
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800/50 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeck.isPending || !name.trim()}
                  className="px-6 py-2.5 bg-[#D4A017] text-black font-bold rounded-xl hover:bg-[#F2C84B] hover:shadow-[0_0_20px_rgba(212,160,23,0.3)] transition-all disabled:opacity-50 active:scale-95"
                >
                  {createDeck.isPending ? "Creating..." : "Create Deck"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
