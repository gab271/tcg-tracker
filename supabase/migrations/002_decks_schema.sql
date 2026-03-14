-- Migration: 002_decks_schema.sql
-- Description: Create tables for user decks

CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    game TEXT NOT NULL CHECK (game IN ('Pokémon', 'Magic', 'One Piece')),
    cover_card_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deck_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(deck_id, card_id)
);

-- Enable RLS
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decks
CREATE POLICY "Users can view their own decks" ON public.decks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks" ON public.decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" ON public.decks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" ON public.decks
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for deck_cards
CREATE POLICY "Users can view cards in their open decks" ON public.deck_cards
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.decks WHERE id = public.deck_cards.deck_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert cards to their decks" ON public.deck_cards
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.decks WHERE id = public.deck_cards.deck_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update cards in their decks" ON public.deck_cards
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.decks WHERE id = public.deck_cards.deck_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete cards from their decks" ON public.deck_cards
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.decks WHERE id = public.deck_cards.deck_id AND user_id = auth.uid()
    ));
