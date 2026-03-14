import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DecksClient from '@/components/decks/DecksClient';

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/api/auth');
  }

  // Fetch decks and count their cards
  const { data: decks, error } = await supabase
    .from('decks')
    .select(`
      *,
      deck_cards (count)
    `)
    .order('created_at', { ascending: false });

  const formattedDecks = decks?.map((deck) => ({
    ...deck,
    card_count: deck.deck_cards?.[0]?.count || 0
  })) || [];

  return <DecksClient initialDecks={formattedDecks} />;
}
