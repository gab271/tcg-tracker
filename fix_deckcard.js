const fs = require('fs');

const deckPath = 'src/components/decks/DeckCard.tsx';

const newDeckCard = `import { motion } from 'framer-motion';

const GAME_COLORS: Record<string, string> = {
  'Pokémon': '#EF4444',
  'Magic: The Gathering': '#3B82F6',
  'One Piece': '#EAB308',
  'Yu-Gi-Oh!': '#8B5CF6'
};

const GAME_LOGOS: Record<string, string> = {
  'Pokémon': 'https://placehold.co/100x140/EF4444/white.png?text=PKMN',
  'Magic: The Gathering': 'https://placehold.co/100x140/3B82F6/white.png?text=MTG',
  'One Piece': 'https://placehold.co/100x140/EAB308/white.png?text=OP',
  'Yu-Gi-Oh!': 'https://placehold.co/100x140/8B5CF6/white.png?text=YGO'
};


export function DeckCard({ deck }: { deck: any }) {
  const accentColor = GAME_COLORS[deck.game] || '#D4A017';
  
  // Calculate completion (assuming deck format standard to 60 for demo, but using generic max logic)
  const count = deck.card_count || 0;
  const maxFormatCards = deck.game === 'Magic: The Gathering' ? 60 : 60; // Assuming 60 for simplicity
  const progressPercent = Math.min((count / maxFormatCards) * 100, 100);
  
  // Fake top 3 fallback images
  const cards = deck.top_cards || [
    GAME_LOGOS[deck.game] || GAME_LOGOS['Pokémon'],
    GAME_LOGOS[deck.game] || GAME_LOGOS['Pokémon'],
    GAME_LOGOS[deck.game] || GAME_LOGOS['Pokémon']
  ];

  return (
    <motion.div 
      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(212, 160, 23, 0.4)", borderColor: "#D4A017" }}
      className="group relative flex flex-col w-full w-[280px] h-[360px] mx-auto rounded-2xl border border-gray-800 bg-[#111] overflow-hidden cursor-pointer"
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ background: \`linear-gradient(to bottom right, \${accentColor}, transparent)\` }} 
      />

      {/* Top 55% - Cards */}
      <div className="h-[55%] relative flex justify-center items-end pb-4 pt-6 z-10 overflow-hidden">
        {/* Fanned Cards layout */}
        <div className="relative w-full h-full flex justify-center">
          {/* Card 3 (Left) */}
          <div className="absolute w-24 h-32 rounded-lg bg-gray-800 shadow-xl border border-gray-700 transform -rotate-[15deg] -translate-x-12 translate-y-4 overflow-hidden">
            <img src={cards[2] || GAME_LOGOS[deck.game]} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          {/* Card 2 (Right) */}
          <div className="absolute w-24 h-32 rounded-lg bg-gray-800 shadow-xl border border-gray-700 transform rotate-[15deg] translate-x-12 translate-y-4 overflow-hidden">
            <img src={cards[1] || GAME_LOGOS[deck.game]} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          {/* Card 1 (Center) */}
          <div className="absolute w-28 h-36 rounded-lg bg-gray-800 shadow-2xl border border-gray-600 z-10 -translate-y-2 overflow-hidden group-hover:-translate-y-4 transition-transform duration-300">
            <img src={cards[0] || GAME_LOGOS[deck.game]} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      </div>

      {/* Bottom 45% - Info */}
      <div className="h-[45%] flex flex-col p-5 bg-gradient-to-t from-[#050505] to-[#111] z-10 border-t border-gray-800/50">
        
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white truncate pr-2" title={deck.name}>{deck.name}</h3>
          <span 
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded text-white"
            style={{ backgroundColor: accentColor }}
          >
            {deck.game}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-auto">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{count}/{maxFormatCards} cards</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#D4A017] rounded-full" 
              style={{ width: \`\${progressPercent}%\` }}
            />
          </div>
        </div>

        {/* Value and Date */}
        <div className="flex justify-between items-end mt-4">
          <div>
            <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Est. Value</span>
            <span className="text-lg font-mono font-bold text-[#D4A017]">€{deck.total_value ? deck.total_value.toFixed(2) : '0.00'}</span>
          </div>
          <span className="text-[10px] text-gray-500">
            {new Date(deck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
`;

fs.writeFileSync(deckPath, newDeckCard);
