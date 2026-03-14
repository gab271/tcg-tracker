'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

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
  const [game, setGame] = useState('Pokémon');
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
      { name, game, user_id: userData.user.id }
    ]);

    setLoading(false);
    if (!error) {
      setName('');
      setGame('Pokémon');
      onSuccess();
      onClose();
      router.refresh();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#121212] border border-[#222] p-6 rounded-xl w-full max-w-md shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-4">Create New Deck</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Deck Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#D4A017]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Game</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#D4A017]"
              >
                <option value="Pokémon">Pokémon</option>
                <option value="Magic">Magic: The Gathering</option>
                <option value="One Piece">One Piece</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#D4A017] text-black font-semibold rounded hover:bg-[#b88c14] transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Deck'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
