'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react';

export function SortableCardRow({ 
  card, 
  onUpdateQuantity 
}: { 
  card: any;
  onUpdateQuantity: (id: string, delta: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center group transition-colors ${
        isDragging 
          ? 'bg-[#1e1e1e] border border-[#D4A017]/50 shadow-2xl relative z-50 rounded-lg' 
          : 'hover:bg-[#1a1a1a] bg-transparent'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-white cursor-grab active:cursor-grabbing hover:bg-white/5 rounded"
      >
        <GripVertical size={16} />
      </div>

      <div className="flex items-center gap-3 font-semibold text-gray-200">
        <div className="w-8 h-10 bg-black rounded overflow-hidden flex-shrink-0 border border-[#333]">
          {card.image_url && <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />}
        </div>
        <span>{card.name}</span>
      </div>

      <div className="text-right w-24 text-[#D4A017] font-medium">
        ${card.price?.toFixed(2) || '0.00'}
      </div>

      <div className="flex items-center justify-end w-24 gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(card.id, -1); }}
          className="w-6 h-6 flex items-center justify-center rounded bg-[#222] hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-colors"
        >
          {card.quantity <= 1 ? <Trash2 size={12} /> : <Minus size={12} />}
        </button>
        <div className="w-6 text-center text-sm font-bold text-white">
          {card.quantity}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(card.id, 1); }}
          className="w-6 h-6 flex items-center justify-center rounded bg-[#222] hover:bg-green-900/40 hover:text-green-400 text-gray-400 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
