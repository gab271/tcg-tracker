"use client";

import { useState, useMemo } from "react";
import { DeckCard } from "./DeckCard";
import CreateDeckModal from "./CreateDeckModal";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { Plus, Layers } from "lucide-react";
import type { DeckRow } from "@/lib/supabase/queries/decks";

const TABS = [
  { label: "All",     value: "All",                   color: "#d4af37", symbol: "◈" },
  { label: "Pokémon", value: "Pokémon",                color: "#ef4444", symbol: "⚡" },
  { label: "Magic",   value: "Magic: The Gathering",   color: "#3b82f6", symbol: "✦" },
  { label: "One Piece", value: "One Piece",            color: "#eab308", symbol: "☠" },
  { label: "YGO",     value: "Yu-Gi-Oh!",              color: "#a855f7", symbol: "★" },
];

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
  const [decks] = useState(initialDecks);
  const [activeTab, setActiveTab] = useState("All");

  const animatedDecks = useCountUp(decks.length);
  const animatedCards = useCountUp(totalCards);
  const animatedValue = useCountUp(totalValue);

  const filteredDecks = useMemo(() => {
    if (activeTab === "All") return decks;
    return decks.filter((d) => d.game === activeTab);
  }, [decks, activeTab]);

  const handleDeckCreated = () => { window.location.reload(); };

  return (
    <div className="relative min-h-screen">
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#080a0d]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 1L55 16v16L28 47 1 32V16Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "56px 48px",
          }}
        />
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-gold-500/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-8 px-5 lg:px-10">

        {/* ── HEADER ── */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
          >
            {/* Title */}
            <div>
              <p className="text-[9px] font-bold text-gold-400/60 uppercase tracking-[0.25em] mb-2">
                Vault · Deck Manager
              </p>
              <h1 className="font-display text-4xl font-bold text-white tracking-wide">
                My Decks
              </h1>
            </div>

            {/* Stats + CTA row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Stat pills */}
              <div className="flex items-center gap-2">
                {[
                  { label: "Decks",  value: Math.round(animatedDecks).toString(), color: "text-white" },
                  { label: "Cards",  value: Math.round(animatedCards).toString(), color: "text-white" },
                  { label: "Value",  value: `€${animatedValue.toFixed(0)}`, color: "text-gold-400" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-xl border border-gray-800/60 bg-vault-800/40 text-center min-w-[70px]"
                  >
                    <p className={`font-mono font-bold text-sm ${s.color}`}>{s.value}</p>
                    <p className="text-[8px] text-gray-600 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_30px_rgba(212,175,55,0.42)]"
              >
                <Plus className="w-4 h-4" />
                New Deck
              </motion.button>
            </div>
          </motion.div>

          {/* ── Filter Tabs ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            className="flex gap-1.5 overflow-x-auto pb-1"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive ? `${tab.color}12` : "transparent",
                    border: isActive ? `1px solid ${tab.color}35` : "1px solid transparent",
                    color: isActive ? tab.color : "#6b7280",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-symbol"
                      className="text-xs"
                      style={{ color: tab.color }}
                    >
                      {tab.symbol}
                    </motion.span>
                  )}
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ boxShadow: `0 0 12px ${tab.color}20` }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* ── DECK GRID ── */}
        {filteredDecks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center justify-center text-center py-32"
          >
            {/* Empty state card stack illustration */}
            <div className="relative w-32 h-44 mb-8">
              {[
                { rotate: -12, x: -28, y: 10, z: 1, opacity: 0.12 },
                { rotate: -6,  x: -14, y: 5,  z: 2, opacity: 0.2  },
                { rotate: 0,   x: 0,   y: 0,  z: 3, opacity: 0.35 },
              ].map((card, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-xl border border-gold-500/20"
                  style={{
                    background: "linear-gradient(155deg, #1c1810, #0f1115)",
                    transform: `rotate(${card.rotate}deg) translateX(${card.x}px) translateY(${card.y}px)`,
                    zIndex: card.z,
                    opacity: card.opacity,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-5xl text-gold-500/20">
                    ◈
                  </div>
                </div>
              ))}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Layers className="w-10 h-10 text-gold-500/30" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-white mb-3">
              {activeTab === "All" ? "No decks in your vault" : `No ${activeTab} decks yet`}
            </h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
              {activeTab === "All"
                ? "Build your first deck and start tracking its card composition and value."
                : `Create your first ${activeTab} deck to get started.`}
            </p>
            {activeTab === "All" && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(212,175,55,0.25)]"
              >
                <Plus className="w-4 h-4" />
                Create Your First Deck
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredDecks.map((deck, i) => (
                <motion.div
                  layout
                  key={deck.id}
                  initial={{ opacity: 0, y: 24, rotate: -1 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: i * 0.07, type: "spring", damping: 22 }}
                >
                  <Link href={`/decks/${deck.id}`} className="block">
                    <DeckCard deck={deck} />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDeckCreated}
      />
    </div>
  );
}
