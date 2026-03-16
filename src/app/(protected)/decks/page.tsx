import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DecksClient from "@/components/decks/DecksClient";
import type { DeckRow } from "@/lib/supabase/queries/decks";

export default async function DecksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/api/auth");

  const { data: decks } = await supabase
    .from("decks")
    .select(`*, deck_cards(id, quantity, price)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  let totalValue = 0;
  let totalCards = 0;

  const formattedDecks: DeckRow[] = (decks ?? []).map((deck) => {
    const deckCards = (deck.deck_cards ?? []) as { id: string; quantity: number; price?: number }[];
    const cardCount = deckCards.reduce((acc, dc) => acc + (dc.quantity ?? 1), 0);
    const deckValue = deckCards.reduce(
      (acc, dc) => acc + (dc.price ?? 0) * (dc.quantity ?? 1),
      0
    );

    totalCards += cardCount;
    totalValue += deckValue;

    return {
      id: deck.id,
      user_id: deck.user_id,
      name: deck.name,
      game: deck.game,
      cover_card_id: deck.cover_card_id ?? null,
      description: deck.description,
      format: deck.format,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  });

  return (
    <DecksClient
      initialDecks={formattedDecks}
      totalValue={totalValue}
      totalCards={totalCards}
    />
  );
}
