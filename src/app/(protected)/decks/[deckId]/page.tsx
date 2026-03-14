import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DeckDetailClient from '@/components/decks/DeckDetailClient';

export default async function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/api/auth');
  }

  // Await the params object before accessing its properties (Next.js 15 requirement)
  const resolvedParams = await params;
  const deckId = resolvedParams.deckId;

  // Fetch deck and cards
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (deckError || !deck) {
    redirect('/decks');
  }

  const { data: cards, error: cardsError } = await supabase
    .from('deck_cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('order_index', { ascending: true });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-white">
      <DeckDetailClient initialDeck={deck} initialCards={cards || []} />
    </div>
  );
}