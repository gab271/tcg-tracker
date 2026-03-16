"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableCardRow } from "./SortableCardRow";
import {
  useUpdateCardOrder,
  useUpdateCardQuantity,
  useDeleteDeckCard,
} from "@/hooks/use-decks";
import type { DeckRow, DeckCardRow } from "@/lib/supabase/queries/decks";

interface DeckDetailClientProps {
  initialDeck: DeckRow;
  initialCards: DeckCardRow[];
}

export default function DeckDetailClient({ initialDeck, initialCards }: DeckDetailClientProps) {
  const [deck] = useState(initialDeck);
  const [cards, setCards] = useState(initialCards);

  const updateOrder = useUpdateCardOrder();
  const updateQuantity = useUpdateCardQuantity();
  const deleteCard = useDeleteDeckCard();

  const isSaving = updateOrder.isPending;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalCards = useMemo(
    () => cards.reduce((sum, card) => sum + card.quantity, 0),
    [cards]
  );
  const totalValue = useMemo(
    () => cards.reduce((sum, card) => sum + card.price * card.quantity, 0),
    [cards]
  );

  const expectedCards = deck.game === "One Piece" ? 50 : 60;
  const isLegal = totalCards === expectedCards;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cards, oldIndex, newIndex);

    setCards(reordered);
    updateOrder.mutate(reordered.map((card, index) => ({ id: card.id, order_index: index })));
  };

  const handleRemove = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    deleteCard.mutate(cardId);
  };

  const handleUpdateQuantity = (cardId: string, delta: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const newQty = card.quantity + delta;
    if (newQty <= 0) {
      handleRemove(cardId);
      return;
    }

    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, quantity: newQty } : c)));
    updateQuantity.mutate({ cardId, quantity: newQty });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#D4A017]/20 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A017]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-amber-200">
                {deck.name}
              </h1>
              <span className="bg-[#D4A017]/10 text-[#D4A017] px-3 py-1 rounded-full text-sm font-semibold border border-[#D4A017]/30">
                {deck.game}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex flex-col bg-[#0a0a0a] border border-[#222] px-4 py-2 rounded-xl">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Value</span>
                <span className="text-xl font-bold text-white">${totalValue.toFixed(2)}</span>
              </div>
              <div
                className={`flex flex-col border px-4 py-2 rounded-xl transition-colors ${
                  isLegal
                    ? "bg-green-950/30 border-green-500/30"
                    : "bg-red-950/30 border-red-500/30"
                }`}
              >
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Cards Status
                </span>
                <span
                  className={`text-xl font-bold ${isLegal ? "text-green-400" : "text-red-400"}`}
                >
                  {totalCards} / {expectedCards}
                  <span className="text-sm font-normal ml-2 opacity-80">
                    {isLegal ? "Legal" : "Invalid Size"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0">
            {isSaving && (
              <div className="text-xs text-[#D4A017] animate-pulse">Saving order...</div>
            )}
            <button className="bg-[#1a1a1a] hover:bg-[#222] text-[#D4A017] border border-[#D4A017]/30 font-semibold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(212,160,23,0.1)] hover:shadow-[0_0_20px_rgba(212,160,23,0.3)] mt-2">
              + Find & Add Cards
            </button>
          </div>
        </div>
      </div>

      {/* Cards List with DnD */}
      <div className="bg-[#121212] rounded-2xl border border-[#222] overflow-hidden p-1">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#222]">
          <div className="w-8" />
          <div>Card Name</div>
          <div className="text-right w-24">Price</div>
          <div className="text-right w-24">Quantity</div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-300 mb-2">No cards in this deck</h3>
            <p className="text-gray-500">Search the market or your collection to add some.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col divide-y divide-[#222]/50">
                {cards.map((card) => (
                  <SortableCardRow
                    key={card.id}
                    card={card}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
