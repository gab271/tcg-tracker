"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  Star,
  Check,
  Lock,
  Pencil,
  Layers,
  TrendingUp,
  LayoutGrid,
  Trophy,
  History,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  useProfile,
  useUserStats,
  useUpdateDisplayName,
  useUploadAvatar,
} from "@/hooks/use-profile";
import { useCollection } from "@/hooks/use-collection";
import { useCountUp } from "@/hooks/use-count-up";
import { mapSupabaseError } from "@/lib/errors";

// ── Config ────────────────────────────────────────────────────────────────────

const GAME_CONFIG: Record<string, { color: string; symbol: string; accent: string }> = {
  "Pokémon":              { color: "#ef4444", symbol: "⚡", accent: "#ef444430" },
  "Magic: The Gathering": { color: "#3b82f6", symbol: "✦", accent: "#3b82f630" },
  "One Piece":            { color: "#eab308", symbol: "☠", accent: "#eab30830" },
  "Yu-Gi-Oh!":            { color: "#a855f7", symbol: "★", accent: "#a855f730" },
};

const BADGE_DATA = [
  {
    id: "first_card",
    name: "First Relic",
    desc: "Added your first card to the vault",
    symbol: "◈",
    color: "#d4af37",
    check: (cards: number) => cards > 0,
  },
  {
    id: "vault_starter",
    name: "Vault Keeper",
    desc: "Secured 10 or more cards",
    symbol: "◆",
    color: "#60a5fa",
    check: (cards: number) => cards >= 10,
  },
  {
    id: "deck_builder",
    name: "Architect",
    desc: "Assembled your first deck",
    symbol: "⊞",
    color: "#4ade80",
    check: (_: number, decks: number) => decks > 0,
  },
  {
    id: "market_explorer",
    name: "The Broker",
    desc: "Explored the card market",
    symbol: "◎",
    color: "#f59e0b",
    check: () => true,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName]         = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useProfile();
  const { data: stats }              = useUserStats();
  const { data: collection = [] }    = useCollection();
  const updateDisplayName            = useUpdateDisplayName();
  const uploadAvatar                 = useUploadAvatar();

  const recentActivity = collection.slice(0, 6);
  const games          = [...new Set(collection.map((item) => item.game))];

  // Dominant game drives ambient color palette
  const primaryGame  = games[0];
  const gameCfg      = GAME_CONFIG[primaryGame] ?? { color: "#d4af37", symbol: "◈", accent: "#d4af3730" };

  // Animated stat counters
  const animCards = useCountUp(stats?.totalCards ?? 0);
  const animValue = useCountUp(stats?.totalValue  ?? 0);
  const animDecks = useCountUp(stats?.deckCount   ?? 0);

  const badges = BADGE_DATA.map((b) => ({
    ...b,
    unlocked: b.check(stats?.totalCards ?? 0, stats?.deckCount ?? 0),
  }));
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!draftName.trim()) return;
    try {
      await updateDisplayName.mutateAsync(draftName.trim());
      toast.success("Name updated!");
      setIsEditingName(false);
    } catch (err) {
      toast.error(mapSupabaseError(err));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Photo updated!");
    } catch (err) {
      toast.error(mapSupabaseError(err));
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    );
  }

  const displayName = profile?.displayName ?? "Anonymous Collector";
  const email       = profile?.email       ?? "";
  const avatarUrl   = profile?.avatarUrl   ?? null;
  const plan        = profile?.plan        ?? "FREE";
  const memberSince = profile?.memberSince ?? "";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-vault-900">

      {/* ── Atmospheric background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Game-adaptive ambient bloom */}
        <motion.div
          key={primaryGame}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] rounded-full blur-[180px]"
          style={{ background: `radial-gradient(ellipse, ${gameCfg.color}09 0%, transparent 70%)` }}
        />
        {/* Hexagonal micro-grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 2L54 16v16L28 46 2 32V16Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "56px 48px",
          }}
        />
        {/* Faint bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-vault-900 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 lg:px-10 py-10">

        {/* ══════════════════════════════════════════════
            HERO PANEL
        ══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl mb-5"
          style={{
            background: "linear-gradient(160deg, #131826 0%, #0b0f1c 50%, #06080e 100%)",
            border: "1px solid rgba(212,132,26,0.1)",
            boxShadow: `0 0 100px ${gameCfg.color}06, inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Game-color top accent line */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${gameCfg.color}70, transparent)` }}
          />
          {/* Side ambient wash */}
          <div
            className="absolute top-0 left-0 bottom-0 w-48 opacity-[0.04]"
            style={{ background: `linear-gradient(to right, ${gameCfg.color}, transparent)` }}
          />

          <div className="px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">

            {/* ── Avatar ── */}
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {/* Rotating border ring */}
              <div
                className="absolute -inset-[3px] rounded-[20px] transition-opacity duration-300 opacity-50 group-hover:opacity-100"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0 60%, ${gameCfg.color} 80%, transparent 100%)`,
                  animation: "spin 5s linear infinite",
                }}
              />
              {/* Static border layer */}
              <div
                className="absolute -inset-[1px] rounded-[18px] opacity-30"
                style={{ background: `linear-gradient(135deg, ${gameCfg.color}40, transparent 60%)` }}
              />

              {/* Avatar frame — octagonal clip */}
              <div
                className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-[18px] overflow-hidden bg-[#0a0c12] z-10"
                style={{ clipPath: "polygon(15% 0%,85% 0%,100% 15%,100% 85%,85% 100%,15% 100%,0% 85%,0% 15%)" }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="font-display text-5xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${gameCfg.color}, #d4af37)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {(displayName.charAt(0) || "C").toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Camera overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                  {uploadAvatar.isPending
                    ? <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
                    : <>
                        <Camera className="w-6 h-6 text-white mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white">Change</span>
                      </>
                  }
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
              />
            </div>

            {/* ── Identity ── */}
            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left pt-1">

              {/* Eyebrow */}
              <p className="text-[9px] font-bold text-gold-400/50 uppercase tracking-[0.3em] mb-2">
                Vault · Collector Profile
              </p>

              {/* Display name — editable */}
              <div className="mb-3 h-10 flex items-center">
                <AnimatePresence mode="wait">
                  {isEditingName ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        autoFocus
                        className="font-display text-2xl font-bold bg-transparent border-b-2 border-gold-500/50 text-white focus:outline-none focus:border-gold-400 pb-0.5 min-w-[180px]"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={updateDisplayName.isPending}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                        style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}
                      >
                        {updateDisplayName.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="display"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => { setDraftName(displayName); setIsEditingName(true); }}
                      className="group/name flex items-center gap-2.5"
                    >
                      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white group-hover/name:text-gold-300 transition-colors leading-none">
                        {displayName}
                      </h1>
                      <Pencil className="w-4 h-4 text-gray-800 opacity-0 group-hover/name:opacity-100 group-hover/name:text-gold-600 transition-all" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Plan + email */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3 justify-center sm:justify-start">
                {plan === "PRO" ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/35 text-gold-400 text-xs font-bold uppercase tracking-widest">
                    <Star className="w-3 h-3 fill-gold-400" />
                    Pro Member
                  </span>
                ) : (
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/4 border border-white/10 text-gray-500 text-xs font-bold uppercase tracking-widest hover:border-gold-500/25 hover:text-gold-600/70 transition-all"
                  >
                    Free Plan
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Lock className="w-2.5 h-2.5" />
                  {email}
                </span>
              </div>

              {/* Member since */}
              {memberSince && (
                <p className="text-[10px] text-gray-700 uppercase tracking-[0.2em] font-semibold mb-4">
                  Member since {memberSince}
                </p>
              )}

              {/* Game collection pills */}
              {games.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {games.map((game) => {
                    const cfg = GAME_CONFIG[game] ?? { color: "#d4af37", symbol: "◈" };
                    return (
                      <span
                        key={game}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: `${cfg.color}10`,
                          border: `1px solid ${cfg.color}28`,
                          color: cfg.color,
                        }}
                      >
                        <span>{cfg.symbol}</span>
                        {game}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-700 italic">No cards in collection yet.</p>
              )}
            </div>

            {/* Settings shortcut */}
            <Link
              href="/settings"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 text-gray-600 hover:text-gray-300 text-xs font-medium transition-all self-start"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
          {[
            {
              label:   "Cards in Vault",
              value:   Math.round(animCards).toLocaleString(),
              icon:    Layers,
              color:   "#d4af37",
              delay:   0.18,
            },
            {
              label:   "Collection Value",
              value:   `€${animValue.toFixed(0)}`,
              icon:    TrendingUp,
              color:   "#4ade80",
              delay:   0.24,
            },
            {
              label:   "Decks Built",
              value:   Math.round(animDecks).toString(),
              icon:    LayoutGrid,
              color:   "#60a5fa",
              delay:   0.30,
            },
          ].map(({ label, value, icon: Icon, color, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-gold-500/10 bg-vault-700 group hover:border-gold-500/20 transition-colors"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 20% 30%, ${color}06, transparent)` }}
              />
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${color}14`, border: `1px solid ${color}22` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              {/* Value */}
              <p className="font-mono font-bold text-xl sm:text-2xl text-white leading-none mb-1">{value}</p>
              {/* Label */}
              <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">{label}</p>

              {/* Corner accent */}
              <div
                className="absolute top-0 right-0 w-12 h-12 opacity-[0.04] pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }}
              />
            </motion.div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            CONTENT ROW — Activity + Badges
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Recent Activity ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl overflow-hidden border border-gold-500/10 bg-vault-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold-500/10">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-gold-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Recent Activity
                </span>
              </div>
              <Link
                href="/collection"
                className="text-[10px] text-gray-700 hover:text-gold-500 transition-colors uppercase tracking-widest"
              >
                View all →
              </Link>
            </div>

            {/* Rows */}
            <div className="flex-1 divide-y divide-white/[0.04]">
              {recentActivity.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center mb-3">
                    <History className="w-4 h-4 text-gray-700" />
                  </div>
                  <p className="text-sm text-gray-600">No activity yet</p>
                  <p className="text-xs text-gray-800 mt-1">
                    Cards you add will appear here.
                  </p>
                </div>
              ) : (
                recentActivity.map((item, i) => {
                  const cfg = GAME_CONFIG[item.game] ?? { color: "#d4af37", symbol: "◈" };
                  return (
                    <motion.div
                      key={item.id ?? i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors group/row"
                    >
                      {/* Game symbol badge */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                        style={{
                          background: `${cfg.color}10`,
                          border: `1px solid ${cfg.color}20`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.symbol}
                      </div>

                      {/* Card info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover/row:text-gold-300 transition-colors leading-snug">
                          {item.card_name}
                        </p>
                        <p className="text-[10px] text-gray-700 font-mono leading-none mt-0.5">
                          {new Date(item.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Price */}
                      <span className="font-mono text-xs font-bold text-emerald-400 flex-shrink-0">
                        €{item.price.toFixed(2)}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* ── Achievement Badges ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl overflow-hidden border border-gold-500/10 bg-vault-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold-500/10">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-gold-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Collector Badges
                </span>
              </div>
              <span className="text-[10px] text-gray-700 uppercase tracking-widest font-mono">
                {unlockedCount}/{badges.length}
              </span>
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.42 + i * 0.07, type: "spring", damping: 18 }}
                  className="relative overflow-hidden rounded-xl p-4 border group/badge transition-all duration-300"
                  style={{
                    background: badge.unlocked
                      ? `linear-gradient(145deg, ${badge.color}08 0%, rgba(255,255,255,0.02) 100%)`
                      : "rgba(255,255,255,0.02)",
                    borderColor: badge.unlocked ? `${badge.color}25` : "rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Shine sweep on hover */}
                  {badge.unlocked && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                      <div
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover/badge:translate-x-[250%] transition-transform duration-700 ease-in-out"
                      />
                    </div>
                  )}

                  {/* Lock icon (locked state) */}
                  {!badge.unlocked && (
                    <Lock className="absolute top-2.5 right-2.5 w-3 h-3 text-gray-800" />
                  )}

                  {/* Badge symbol */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform duration-300 group-hover/badge:scale-110"
                    style={{
                      background: badge.unlocked ? `${badge.color}12` : "rgba(255,255,255,0.04)",
                      border: badge.unlocked ? `1px solid ${badge.color}25` : "1px solid rgba(255,255,255,0.06)",
                      filter: badge.unlocked ? "none" : "grayscale(1) opacity(0.2)",
                    }}
                  >
                    <span style={{ color: badge.unlocked ? badge.color : "transparent" }}>
                      {badge.symbol}
                    </span>
                  </div>

                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-1 leading-none"
                    style={{ color: badge.unlocked ? badge.color : "rgba(255,255,255,0.15)" }}
                  >
                    {badge.name}
                  </p>
                  <p
                    className="text-[10px] leading-snug"
                    style={{ color: badge.unlocked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)" }}
                  >
                    {badge.desc}
                  </p>

                  {/* Subtle glow for unlocked */}
                  {badge.unlocked && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
                      style={{ background: `radial-gradient(ellipse at 30% 20%, ${badge.color}06, transparent)` }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
