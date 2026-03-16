"use client";

import { useState, useMemo } from "react";
import { DeckCard } from "./DeckCard";
import CreateDeckModal from "./CreateDeckModal";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import type { DeckRow } from "@/lib/supabase/queries/decks";

const TABS = ["All", "Pokémon", "Magic: The Gathering", "One Piece", "Yu-Gi-Oh!"];

interface DecksClientProps {
  initialDecks: DeckRow[];
  totalValue?: number;
  totalCards?: number;
}

export default function DecksClient({
  initialDecks,
  totalValue = 0,
  totalCards = 0,
}: DecksClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decks, setDecks] = useState(initialDecks);
  const [activeTab, setActiveTab] = useState("All");

  const animatedDecks = useCountUp(decks.length);
  const animatedCards = useCountUp(totalCards);
  const animatedValue = useCountUp(totalValue);

  const filteredDecks = useMemo(() => {
    if (activeTab === "All") return decks;
    return decks.filter((d) => d.game === activeTab);
  }, [decks, activeTab]);

  // Called after successful deck creation — refetch is handled by React Query,
  // but we get a fresh server-side list via router.refresh() inside the modal.
  // For now we optimistically add nothing here; React Query invalidation handles it.
  const handleDeckCreated = () => {
    // DecksClient receives initialDecks as server props.
    // A full refresh will re-run the server component and pass updated props.
    // If this page is fully client-driven later, swap to useDecks() hook.
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* HEADER */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">My Decks</h1>
            <div className="w-16 h-1 bg-[#D4A017] rounded-full mb-6" />

            <div className="flex gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">
                  Total Decks
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {Math.round(animatedDecks)}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">
                  Total Cards
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {Math.round(animatedCards)}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">
                  Total Value
                </span>
                <span className="text-xl font-bold font-mono text-[#D4A017]">
                  €{animatedValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 bg-[#D4A017] hover:bg-[#b88c14] text-black font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(212,160,23,0.3)] flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span> New Deck
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-800">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab ? "text-[#D4A017]" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "Magic: The Gathering" ? "Magic" : tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeDeckTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A017]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DECK GRID */}
      {filteredDecks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center justify-center text-center py-32 rounded-3xl"
        >
          <div className="mb-6 opacity-20">
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A017"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Your vault has no decks yet
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            {activeTab === "All"
              ? "Build your first deck and start tracking its value"
              : `You don't have any ${activeTab} decks yet.`}
          </p>
          {activeTab === "All" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#D4A017] text-black font-bold py-3 px-8 rounded-xl hover:bg-[#F2C84B] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,160,23,0.3)]"
            >
              Create Your First Deck
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-stretch"
        >
          <AnimatePresence mode="popLayout">
            {filteredDecks.map((deck, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                key={deck.id}
                className="w-full flex justify-center md:block"
              >
                <Link
                  href={`/decks/${deck.id}`}
                  className="w-full max-w-[280px] md:max-w-none block"
                >
                  <DeckCard deck={deck} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDeckCreated}
      />
    </div>
  );
}
