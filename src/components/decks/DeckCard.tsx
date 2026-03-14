export function DeckCard({ deck }: { deck: any }) {
  return (
    <div className="group relative rounded-2xl border border-[#D4A017]/20 bg-[#121212]/80 backdrop-blur-sm overflow-hidden hover:border-[#D4A017] hover:shadow-[0_0_20px_rgba(212,160,23,0.15)] transition-all duration-300 cursor-pointer flex flex-col min-h-[250px] transform hover:-translate-y-1">
      {/* Cover Image */}
      <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 transition-opacity flex justify-center items-center overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
        {deck.cover_card_id ? (
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${deck.cover_card_id})` }} />
        ) : (
          <div className="text-[#D4A017]/10 font-black text-6xl transform -rotate-12 tracking-widest">{deck.game}</div>
        )}
      </div>
      <div className="relative z-10 flex flex-col justify-end h-full p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent flex-1 mt-auto">
        <h3 className="text-xl font-bold text-white group-hover:text-[#D4A017] transition-colors truncate">{deck.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="inline-flex items-center rounded-full bg-[#D4A017]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4A017] border border-[#D4A017]/20">
            {deck.game}
          </span>
          <span className="text-xs text-gray-400 font-medium bg-black/50 px-2 py-1 rounded-md">
            {deck.card_count || 0} Cards
          </span>
        </div>
      </div>
    </div>
  );
}
