"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Layers, ShoppingCart, Pencil, Sword, Shield, Heart, Sparkles, Zap, Star } from "lucide-react";
import FlipCard from "@/components/collection/FlipCard";
import CardPriceChart from "@/components/collection/CardPriceChart";

// Mock data — in production this would come from Supabase
const MOCK_CARDS: Record<string, any> = {
  "charizard": {
    id: "charizard",
    name: "Charizard",
    set: "Base Set",
    number: "4/102",
    game: "pokemon",
    rarity: "Holo Rare",
    condition: "Near Mint",
    hp: 120,
    type: "Fire",
    attacks: [
      { name: "Fire Spin", damage: "100", cost: "🔥🔥🔥🔥", description: "Discard 2 Energy cards attached to Charizard." },
      { name: "Flamethrower", damage: "50", cost: "🔥🔥🔥", description: "Discard 1 Fire Energy." },
    ],
    weakness: "Water ×2",
    resistance: "Fighting -30",
    retreatCost: "⚪⚪⚪",
    artist: "Mitsuhiro Arita",
    frontImage: "https://images.pokemontcg.io/base1/4_hires.png",
    backImage: "",
    quantity: 1,
  },
  "black-lotus": {
    id: "black-lotus",
    name: "Black Lotus",
    set: "Alpha Edition",
    number: "232/295",
    game: "magic",
    rarity: "Rare",
    condition: "Good",
    type: "Artifact",
    manaCost: "{0}",
    oracleText: "Sacrifice Black Lotus: Add three mana of any one color.",
    artist: "Christopher Rush",
    frontImage: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838",
    backImage: "",
    quantity: 1,
  },
  "umbreon-vmax": {
    id: "umbreon-vmax",
    name: "Umbreon VMAX",
    set: "Evolving Skies",
    number: "215/203",
    game: "pokemon",
    rarity: "Secret Rare",
    condition: "Mint",
    hp: 310,
    type: "Darkness",
    attacks: [
      { name: "Dark Signal", damage: "—", cost: "🌑🌑", description: "Switch 1 of your opponent's Benched Pokémon." },
      { name: "Max Darkness", damage: "160", cost: "🌑🌑🌑", description: "" },
    ],
    weakness: "Grass ×2",
    resistance: "",
    retreatCost: "⚪⚪",
    artist: "PLANETARY☆",
    frontImage: "https://images.pokemontcg.io/swsh7/215_hires.png",
    backImage: "",
    quantity: 1,
  },
};

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params?.cardId as string;
  const card = MOCK_CARDS[cardId];

  if (!card) {
    return (
      <div className="container mx-auto px-6 lg:px-12 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Card Not Found</h1>
        <p className="text-gray-500 mb-6">The card &quot;{cardId}&quot; doesn&apos;t exist in your vault.</p>
        <button onClick={() => router.push("/collection")} className="text-gold-400 hover:underline text-sm uppercase tracking-wider">
          ← Back to Collection
        </button>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    "Mint": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Near Mint": "text-green-400 bg-green-500/10 border-green-500/30",
    "Excellent": "text-blue-400 bg-blue-500/10 border-blue-500/30",
    "Good": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    "Played": "text-orange-400 bg-orange-500/10 border-orange-500/30",
    "Poor": "text-red-400 bg-red-500/10 border-red-500/30",
  };

  const condStyle = conditionColors[card.condition] || "text-gray-400 bg-gray-500/10 border-gray-500/30";

  return (
    <div className="container mx-auto px-6 lg:px-12 py-8 pb-24">
      {/* Back Button */}
      <button
        onClick={() => router.push("/collection")}
        className="flex items-center gap-2 text-gray-400 hover:text-gold-400 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm uppercase tracking-wider">Back to Vault</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column: Card Visual */}
        <div className="flex justify-center lg:sticky lg:top-28 lg:self-start">
          <FlipCard
            frontImage={card.frontImage}
            backImage={card.backImage}
            name={card.name}
          />
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col gap-6">
          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase tracking-widest text-gray-500">{card.set} • {card.number}</span>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${condStyle}`}>
                {card.condition}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-1">{card.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-500/50" />
                {card.rarity}
              </span>
              <span>•</span>
              <span>{card.type}</span>
              {card.hp && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-red-400 font-mono font-bold">
                    <Heart className="w-3.5 h-3.5" />
                    {card.hp} HP
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-bold uppercase tracking-wider hover:bg-gold-500/20 transition-all vault-glow">
              <Layers className="w-4 h-4" />
              Add to Deck
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-vault-800 border border-gray-700 text-gray-300 text-sm font-bold uppercase tracking-wider hover:border-gold-500/30 hover:text-gold-400 transition-all">
              <ShoppingCart className="w-4 h-4" />
              List on Market
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-vault-800 border border-gray-700 text-gray-300 text-sm font-bold uppercase tracking-wider hover:border-gold-500/30 hover:text-gold-400 transition-all">
              <Pencil className="w-4 h-4" />
              Edit Condition
            </button>
          </div>

          {/* Price Chart */}
          <div className="p-6 bg-vault-800 vault-border rounded-xl min-h-[320px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-gold-500/50" />
              Market Price History
            </h3>
            <div className="h-[260px]">
              <CardPriceChart cardId={card.id} game={card.game} />
            </div>
          </div>

          {/* Stats Grid */}
          {card.game === "pokemon" && card.attacks && (
            <div className="p-6 bg-vault-800 vault-border rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                <Sword className="w-3.5 h-3.5 text-gold-500/50" />
                Attacks & Stats
              </h3>
              <div className="flex flex-col gap-4">
                {card.attacks.map((atk: any, i: number) => (
                  <div key={i} className="p-4 bg-vault-900 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold text-sm">{atk.name}</span>
                      <span className="text-gold-400 font-mono font-bold text-lg">{atk.damage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Cost: {atk.cost}</span>
                      {atk.description && <span className="text-gray-600">— {atk.description}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weakness, Resistance, Retreat */}
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-800">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Weakness</p>
                  <p className="text-sm text-red-400 font-medium">{card.weakness || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Resistance</p>
                  <p className="text-sm text-green-400 font-medium">{card.resistance || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Retreat</p>
                  <p className="text-sm text-white font-medium">{card.retreatCost || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Magic Card Text */}
          {card.game === "magic" && card.oracleText && (
            <div className="p-6 bg-vault-800 vault-border rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-gold-500/50" />
                Card Text
              </h3>
              <div className="p-4 bg-vault-900 rounded-lg border border-gray-800">
                {card.manaCost && (
                  <p className="text-xs text-gray-500 mb-2">Mana Cost: <span className="text-white font-mono">{card.manaCost}</span></p>
                )}
                <p className="text-sm text-gray-300 italic leading-relaxed">{card.oracleText}</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="p-6 bg-vault-800 vault-border rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gold-500/50" />
              Details
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Set</p>
                <p className="text-sm text-white font-medium">{card.set}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Number</p>
                <p className="text-sm text-white font-mono">{card.number}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rarity</p>
                <p className="text-sm text-white">{card.rarity}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Quantity</p>
                <p className="text-sm text-white font-mono">×{card.quantity}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Artist</p>
                <p className="text-sm text-white">{card.artist}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
