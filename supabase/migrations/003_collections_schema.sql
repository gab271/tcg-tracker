-- Migration: 003_collections_schema.sql
-- Description: Create collections table for user card collections

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    card_name TEXT NOT NULL,
    card_image TEXT,
    game TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'Common',
    price NUMERIC(10, 2) DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, card_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own collection" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own collection" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own collection" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections (user_id);
CREATE INDEX IF NOT EXISTS idx_collections_game ON public.collections (user_id, game);
