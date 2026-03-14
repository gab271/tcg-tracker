'use client';

import { useState } from 'react';
import { DeckCard } from './DeckCard';
import CreateDeckModal from './CreateDeckModal';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DecksClient({ initialDecks }: { initialDecks: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decks, setDecks] = useState(initialDecks);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-[#D4A017] flex items-center gap-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A017] to-amber-200">
            My Decks
          </span>
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D4A017] hover:bg-[#b88c14] text-black font-semibold py-2 px-6 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(212,160,23,0.3)]"
        >
          + New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#333] rounded-2xl bg-[#0a0a0a]">
          <h2 className="text-2xl font-bold text-gray-400 mb-2">No decks yet</h2>
          <p className="text-gray-500 mb-6">Build your first deck to get started!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[#D4A017] border border-[#D4A017] px-4 py-2 rounded-lg hover:bg-[#D4A017]/10 transition"
          >
            Create your first deck
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <DeckCard deck={deck} />
            </Link>
          ))}
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
