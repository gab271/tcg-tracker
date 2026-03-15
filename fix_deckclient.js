const fs = require('fs');

const deckPath = 'src/components/decks/DecksClient.tsx';

const newDeckClient = `'use client';

import { useState, useMemo } from 'react';
import { DeckCard } from './DeckCard';
import CreateDeckModal from './CreateDeckModal';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['All', 'Pokémon', 'Magic: The Gathering', 'One Piece', 'Yu-Gi-Oh!'];

export default function DecksClient({ initialDecks, totalValue = 0, totalCards = 0 }: { initialDecks: any[], totalValue?: number, totalCards?: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decks] = useState(initialDecks);
  const [activeTab, setActiveTab] = useState('All');

  const filteredDecks = useMemo(() => {
    if (activeTab === 'All') return decks;
    return decks.filter(d => d.game === activeTab);
  }, [decks, activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* HEADER SECTION */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">My Decks</h1>
            <div className="w-16 h-1 bg-[#D4A017] rounded-full mb-6"></div>
            
            {/* Stats Row */}
            <div className="flex gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Total Decks</span>
                <span className="text-xl font-bold font-mono text-white">{decks.length}</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Total Cards</span>
                <span className="text-xl font-bold font-mono text-white">{totalCards}</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Total Value</span>
                <span className="text-xl font-bold font-mono text-[#D4A017]">€{totalValue.toFixed(2)}</span>
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
              className={\`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors \${activeTab === tab ? 'text-[#D4A017]' : 'text-gray-400 hover:text-gray-200'}\`}
            >
              {tab === 'Magic: The Gathering' ? 'Magic' : tab}
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
        <div className="text-center py-32 border border-dashed border-[#333] rounded-3xl bg-[#111]">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500 text-2xl">?</div>
          <h2 className="text-2xl font-bold text-white mb-2">No decks found</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {activeTab === 'All' 
              ? "You haven't built any decks yet. Create your first deck to start adding cards and tracking value."
              : \`You don't have any \${tab} decks yet.\`}
          </p>
          {activeTab === 'All' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[#D4A017] border border-[#D4A017]/30 bg-[#D4A017]/10 px-6 py-3 rounded-xl hover:bg-[#D4A017]/20 transition font-medium"
            >
              Construct your first deck
            </button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-stretch"
        >
          <AnimatePresence mode="popLayout">
            {filteredDecks.map((deck) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={deck.id}
                className="w-full flex justify-center md:block" // Center on mobile, standard grid on md+
              >
                <Link href={\`/decks/\${deck.id}\`} className="w-full max-w-[280px] md:max-w-none block">
                  <DeckCard deck={deck} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {isModalOpen && (
        <CreateDeckModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync(deckPath, newDeckClient);
