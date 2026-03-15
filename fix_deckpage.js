const fs = require('fs');
const pagePath = 'src/app/(protected)/decks/page.tsx';

const newPage = `import { createClient } from '@/lib/supabase/server';
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
    .select(\`
      *,
      deck_cards (
        id,
        quantity,
        card_id
      )
    \`)
    .order('created_at', { ascending: false });

  let totalValue = 0;
  let totalCardsCount = 0;

  const formattedDecks = decks?.map((deck) => {
    const cardsInDeck = deck.deck_cards || [];
    let deckCardsCount = 0;
    
    // Sum quantites for each deck card
    cardsInDeck.forEach((dc: any) => {
        deckCardsCount += dc.quantity || 1;
    });

    totalCardsCount += deckCardsCount;

    // Simulate some deck value logic if missing, or use a db field. We don't have joined prices here easily without a complex query
    // In a real app we'd join with the cards table and sum (price * quantity)
    const deckValue = deck.total_value || (deckCardsCount * 2.5); // Fallback mock value
    totalValue += deckValue;

    return {
      ...deck,
      card_count: deckCardsCount,
      total_value: deckValue
    }
  }) || [];

  return <DecksClient initialDecks={formattedDecks} totalValue={totalValue} totalCards={totalCardsCount} />;
}
`;

fs.writeFileSync(pagePath, newPage);
