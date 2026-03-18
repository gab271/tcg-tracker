"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Layers, Lock, Calendar, ExternalLink } from "lucide-react";
import type { UserProfileRow } from "@/lib/supabase/queries/public-profile";
import type { DbCollection } from "@/types/database";
import type { DeckRow } from "@/lib/supabase/queries/decks";

const GAME_BADGE: Record<string, string> = {
  "Pokémon":              "bg-red-950/60 text-red-300 border-red-800/50",
  "Magic: The Gathering": "bg-blue-950/60 text-blue-300 border-blue-800/50",
  "One Piece":            "bg-yellow-950/60 text-yellow-300 border-yellow-800/50",
  "Yu-Gi-Oh!":            "bg-purple-950/60 text-purple-300 border-purple-800/50",
};

interface Props {
  profile: UserProfileRow;
  collection: DbCollection[];
  decks: DeckRow[];
}

export default function PublicProfileClient({ profile, collection, decks }: Props) {
  const [activeTab, setActiveTab] = useState<"collection" | "decks">("collection");

  const totalValue = collection.reduce((s, c) => s + (c.price ?? 0) * (c.quantity ?? 1), 0);
  const totalCards = collection.reduce((s, c) => s + (c.quantity ?? 1), 0);

  const memberYear = new Date(profile.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-[#080a0d] text-white pb-20">

      {/* ── Hero banner ── */}
      <div className="relative h-36 bg-gradient-to-br from-vault-900 via-[#0d1020] to-[#080a0d] border-b border-gray-800/40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,175,55,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(59,130,246,0.05),transparent_60%)]" />
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end gap-5 -mt-14 mb-6">
          <div className="w-24 h-24 rounded-2xl border-4 border-[#080a0d] bg-vault-800 flex items-center justify-center overflow-hidden shadow-xl shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-600" />
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white leading-tight">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mb-8 flex-wrap">
          {profile.isPublicCollection && (
            <>
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-white">{totalCards.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cards</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-gold-400">
                  ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Value</p>
              </div>
            </>
          )}
          {profile.isPublicDecks && (
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-white">{decks.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Decks</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xl font-bold font-mono text-white flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-600 inline" />
              {memberYear}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Member Since</p>
          </div>
        </div>

        {/* Tabs */}
        {(profile.isPublicCollection || profile.isPublicDecks) && (
          <div className="flex gap-1 border-b border-gray-800 mb-8">
            {profile.isPublicCollection && (
              <button
                onClick={() => setActiveTab("collection")}
                className={`px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "collection"
                    ? "border-gold-500 text-gold-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Collection
              </button>
            )}
            {profile.isPublicDecks && (
              <button
                onClick={() => setActiveTab("decks")}
                className={`px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "decks"
                    ? "border-gold-500 text-gold-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Decks
              </button>
            )}
          </div>
        )}

        {/* Collection tab */}
        {activeTab === "collection" && profile.isPublicCollection && (
          <div>
            {collection.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-sm">No cards in this collection yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {collection.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="aspect-[63/88] rounded-xl overflow-hidden bg-vault-800 border border-gray-800">
                      {card.card_image ? (
                        <img
                          src={card.card_image}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                          {card.card_name}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white truncate">{card.card_name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${GAME_BADGE[card.game] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}>
                          {card.game.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-gold-400">
                          ${card.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Decks tab */}
        {activeTab === "decks" && profile.isPublicDecks && (
          <div>
            {decks.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-sm">No decks shared yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck, i) => {
                  const cardCount = deck.deck_cards?.reduce((s, c) => s + (c.quantity ?? 1), 0) ?? 0;
                  const deckValue = deck.deck_cards?.reduce(
                    (s, c) => s + (c.price ?? 0) * (c.quantity ?? 1),
                    0
                  ) ?? 0;
                  return (
                    <motion.div
                      key={deck.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-5 bg-vault-800/60 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{deck.name}</h3>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{deck.game}</p>
                        </div>
                        <Layers className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{cardCount} cards</span>
                        <span className="text-gold-400/70">${deckValue.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Nothing is public */}
        {!profile.isPublicCollection && !profile.isPublicDecks && (
          <div className="text-center py-20">
            <Lock className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">This profile is private.</p>
          </div>
        )}
      </div>
    </div>
  );
}
