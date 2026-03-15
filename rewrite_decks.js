const fs = require('fs');

const modalPath = 'src/components/decks/CreateDeckModal.tsx';
const clientPath = 'src/components/decks/DecksClient.tsx';

const modalCode = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const GAMES = [
  { name: 'Pokémon', color: '#EF4444' },
  { name: 'Magic: The Gathering', color: '#3B82F6' },
  { name: 'One Piece', color: '#EAB308' },
  { name: 'Yu-Gi-Oh!', color: '#8B5CF6' }
];

const FORMATS = ['Standard', 'Expanded', 'Unlimited'];

export default function CreateDeckModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('Pokémon');
  const [format, setFormat] = useState('Standard');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('decks').insert([
      { name, description, game, format, user_id: userData.user.id }
    ]);

    setLoading(false);
    if (!error) {
      setName('');
      setDescription('');
      setGame('Pokémon');
      setFormat('Standard');
      onSuccess();
      onClose();
      router.refresh(); // optionally we handle refresh externally
    } else {
      console.error(error);
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
                <label className="block text-sm font-semibold text-gray-300 mb-3">Select Game</label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {GAMES.map((g) => {
                    const isSelected = game === g.name;
                    return (
                      <motion.div
                        key={g.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGame(g.name)}
                        className={\`cursor-pointer relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 \${isSelected ? 'bg-[#1a1a1a] shadow-[0_0_15px_rgba(212,160,23,0.15)]' : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-600'}\`}
                        style={{ borderColor: isSelected ? '#D4A017' : undefined }}
                      >
                        <div 
                          className="absolute inset-0 z-0 opacity-10 rounded-xl pointer-events-none" 
                          style={{ background: \`linear-gradient(to bottom right, \${g.color}, transparent)\` }} 
                        />
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10"
                          style={{ backgroundColor: g.color + '40', color: g.color, border: \`1px solid \${g.color}60\` }}
                        >
                          {g.name === 'Magic: The Gathering' ? 'MTG' : g.name.substring(0,3).toUpperCase()}
                        </div>
                        <span className={\`text-sm font-medium z-10 text-center \${isSelected ? 'text-[#D4A017]' : 'text-gray-300'}\`}>
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
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Deck Name</label>
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
                    {FORMATS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description <span className="text-gray-600 font-normal">(Optional)</span></label>
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
                  disabled={loading || !name.trim()}
                  className="px-6 py-2.5 bg-[#D4A017] text-black font-bold rounded-xl hover:bg-[#F2C84B] hover:shadow-[0_0_20px_rgba(212,160,23,0.3)] transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
                >
                  {loading ? 'Creating...' : 'Create Deck'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
`;

const clientCode = `'use client';

import { useState, useMemo, useEffect } from 'react';
import { DeckCard } from './DeckCard';
import CreateDeckModal from './CreateDeckModal';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['All', 'Pokémon', 'Magic: The Gathering', 'One Piece', 'Yu-Gi-Oh!'];

// Custom hook for animating numbers
function useCountUp(end: number, duration: number = 2) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // easeOutExpo
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(end * easeProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return count;
}

export default function DecksClient({ initialDecks, totalValue = 0, totalCards = 0 }: { initialDecks: any[], totalValue?: number, totalCards?: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decks] = useState(initialDecks);
  const [activeTab, setActiveTab] = useState('All');

  const animatedDecks = useCountUp(decks.length);
  const animatedCards = useCountUp(totalCards);
  const animatedValue = useCountUp(totalValue);

  const filteredDecks = useMemo(() => {
    if (activeTab === 'All') return decks;
    return decks.filter(d => d.game === activeTab);
  }, [decks, activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
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
                <span className="text-xl font-bold font-mono text-white">{Math.round(animatedDecks)}</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Total Cards</span>
                <span className="text-xl font-bold font-mono text-white">{Math.round(animatedCards)}</span>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div className="flex flex-col">
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Total Value</span>
                <span className="text-xl font-bold font-mono text-[#D4A017]">€{animatedValue.toFixed(2)}</span>
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center justify-center text-center py-32 rounded-3xl"
        >
          {/* Vault SVG Icon Placeholder */}
          <div className="mb-6 opacity-20 transform hover:scale-105 transition-transform duration-500">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              <circle cx="12" cy="16" r="1"></circle>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Your vault has no decks yet</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            {activeTab === 'All' 
              ? "Build your first deck and start tracking its value"
              : \`You don't have any \${activeTab} decks yet.\`}
          </p>
          {activeTab === 'All' && (
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
                <Link href={\`/decks/\${deck.id}\`} className="w-full max-w-[280px] md:max-w-none block">
                  <DeckCard deck={deck} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MODAL IS INSIDE THE CLIENT BUT HANDLES ITS OWN PRESENCE internally by wrapping with AnimatePresence and conditional rendering */}
      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
`;

fs.writeFileSync(modalPath, modalCode);
fs.writeFileSync(clientPath, clientCode);

