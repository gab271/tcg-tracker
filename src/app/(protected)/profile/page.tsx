"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  Star,
  TrendingUp,
  Layers,
  Award,
  Check,
  Lock,
  History,
  Trophy,
  Gamepad,
} from "lucide-react";
import {
  useProfile,
  useUserStats,
  useUpdateDisplayName,
  useUploadAvatar,
} from "@/hooks/use-profile";
import { mapSupabaseError } from "@/lib/errors";
import { useCollection } from "@/hooks/use-collection";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function ProfilePage() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats } = useUserStats();
  const { data: collection = [] } = useCollection();
  const updateDisplayName = useUpdateDisplayName();
  const uploadAvatar = useUploadAvatar();

  const recentActivity = collection.slice(0, 5);
  const games = [...new Set(collection.map((item) => item.game))];

  const handleEditName = () => {
    setDraftName(profile?.displayName ?? "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!draftName.trim()) return;
    try {
      await updateDisplayName.mutateAsync(draftName.trim());
      toast.success("Name updated!");
      setIsEditingName(false);
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Photo updated successfully!");
    } catch (error) {
      toast.error(mapSupabaseError(error));
    }
  };

  const collectorBadges = [
    {
      id: "first_card",
      name: "First Card",
      description: "Add a card to your collection",
      unlocked: (stats?.totalCards ?? 0) > 0,
    },
    {
      id: "vault_starter",
      name: "Vault Starter",
      description: "Secure 10+ cards in your vault",
      unlocked: (stats?.totalCards ?? 0) >= 10,
    },
    {
      id: "deck_builder",
      name: "Deck Builder",
      description: "Create your first deck",
      unlocked: (stats?.deckCount ?? 0) > 0,
    },
    {
      id: "market_explorer",
      name: "Market Explorer",
      description: "Visit the market to check prices",
      unlocked: true,
    },
  ];

  if (profileLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const displayName = profile?.displayName ?? "Anonymous Collector";
  const email = profile?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? null;
  const plan = profile?.plan ?? "FREE";
  const memberSince = profile?.memberSince ?? "";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      <motion.div variants={itemVariants} className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">
          Collector <span className="text-gold-gradient">Profile</span>
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Identity Card */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1 border vault-border bg-vault-900/50 backdrop-blur-sm rounded-sm relative overflow-hidden flex flex-col items-center p-8 h-fit"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gold-gradient opacity-80 block" />

          {/* Avatar */}
          <div className="relative mb-6 group" onClick={() => fileInputRef.current?.click()}>
            <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#D4A017_360deg)] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-36 h-36 rounded-full border-4 border-vault-900 overflow-hidden flex items-center justify-center bg-gradient-to-br from-vault-800 to-vault-950 cursor-pointer z-10">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gold-gradient uppercase">
                  {displayName.charAt(0) || email.charAt(0) || "C"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                {uploadAvatar.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-white mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase text-white">
                      Change Photo
                    </span>
                  </>
                )}
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

          {/* Identity Info */}
          <div className="w-full flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-2 h-10">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full max-w-[200px]">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    className="w-full bg-vault-950 border border-gold-500/50 rounded-sm py-1.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500 font-bold text-center"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={updateDisplayName.isPending}
                    className="p-1.5 bg-gold-500/20 text-gold-400 rounded-sm hover:bg-gold-500/40 transition-colors"
                  >
                    {updateDisplayName.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={handleEditName}
                  title="Click to edit name"
                >
                  <h2 className="text-2xl font-bold text-white group-hover:text-gold-400 transition-colors text-center">
                    {displayName}
                  </h2>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              {plan === "PRO" ? (
                <div className="px-3 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-400 text-xs font-bold tracking-widest shadow-[0_0_12px_rgba(212,160,23,0.3)] flex items-center gap-1.5 uppercase">
                  <Star className="w-3 h-3 fill-gold-400" />
                  PRO Member
                </div>
              ) : (
                <div className="px-3 py-0.5 rounded-full bg-vault-800 border border-vault-700 text-vault-400 text-xs font-bold tracking-widest uppercase">
                  FREE Plan
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-vault-400 text-sm mt-3 bg-vault-950/50 px-3 py-1.5 rounded-sm border vault-border">
              <Lock className="w-3 h-3" />
              <span className="truncate">{email}</span>
            </div>

            {memberSince && (
              <p className="text-[10px] text-vault-500 mt-4 font-medium uppercase tracking-wider">
                Member since {memberSince}
              </p>
            )}
          </div>

          <div className="w-full h-px border-b vault-border mb-6 border-dashed" />

          {/* Game Badges */}
          <div className="w-full">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-vault-500 mb-3 text-center">
              Active Collections
            </h4>
            {games.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {games.map((game) => (
                  <div
                    key={game}
                    className="px-3 py-1.5 bg-vault-800/80 border vault-border rounded-sm text-xs font-bold text-vault-300 flex items-center gap-1.5"
                  >
                    <Gamepad className="w-3 h-3 text-gold-500" />
                    {game}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-vault-500 text-center italic">No games added yet.</p>
            )}
          </div>
        </motion.div>

        {/* RIGHT — Stats & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-lg font-bold tracking-widest uppercase text-white flex items-center gap-2 border-b vault-border pb-2">
              <TrendingUp className="w-5 h-5 text-gold-400" />
              Collection <span className="text-vault-400">Overview</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ y: -2, borderColor: "rgba(212,160,23,0.3)" }}
                className="bg-vault-900/50 backdrop-blur-sm border vault-border rounded-sm p-5 flex items-start gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-sm bg-vault-800 border vault-border flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-vault-400 mb-1">
                    Total Cards
                  </p>
                  <p className="text-2xl font-bold font-mono text-white">
                    {stats?.totalCards ?? 0}
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2, borderColor: "rgba(212,160,23,0.3)" }}
                className="bg-vault-900/50 backdrop-blur-sm border vault-border rounded-sm p-5 flex items-start gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-sm bg-vault-800 border vault-border flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-vault-400 mb-1">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold font-mono text-white">
                    $
                    {(stats?.totalValue ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Activity + Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="space-y-4 flex flex-col h-full">
              <h3 className="text-lg font-bold tracking-widest uppercase text-white flex items-center gap-2 border-b vault-border pb-2">
                <History className="w-5 h-5 text-gold-400" />
                Recent <span className="text-vault-400">Activity</span>
              </h3>

              <div className="bg-vault-900/40 rounded-sm border vault-border overflow-hidden flex-1">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-vault-800">
                    {recentActivity.map((item, idx) => (
                      <div
                        key={item.id ?? idx}
                        className="p-3.5 hover:bg-vault-800/50 transition-colors flex justify-between items-center group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-1">
                            {item.card_name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-vault-400 px-1.5 py-0.5 rounded-sm bg-vault-950 border vault-border">
                              {item.game}
                            </span>
                            <span className="text-[10px] text-vault-500 font-mono">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1.5 rounded-sm border border-emerald-400/20">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 h-full text-center flex flex-col items-center justify-center">
                    <History className="w-8 h-8 text-vault-700 mb-2" />
                    <p className="text-sm text-vault-400">No activity yet</p>
                    <p className="text-xs text-vault-500 mt-1">Added cards will appear here.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Collector Badges */}
            <motion.div variants={itemVariants} className="space-y-4 flex flex-col h-full">
              <h3 className="text-lg font-bold tracking-widest uppercase text-white flex items-center gap-2 border-b vault-border pb-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                Collector <span className="text-vault-400">Badges</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {collectorBadges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    className={`relative p-4 rounded-sm border flex flex-col items-center text-center overflow-hidden transition-all duration-300 ${
                      badge.unlocked
                        ? "bg-vault-900 border-gold-500/40 shadow-[0_0_15px_rgba(212,160,23,0.1)] hover:shadow-[0_0_20px_rgba(212,160,23,0.2)]"
                        : "bg-vault-950/50 border-vault-800 opacity-60 grayscale"
                    }`}
                  >
                    {badge.unlocked && (
                      <motion.div
                        initial={{ opacity: 0.3, scale: 0.8 }}
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gold-400/5 z-0"
                      />
                    )}
                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                          badge.unlocked
                            ? "bg-gold-500/20 text-gold-400"
                            : "bg-vault-800 text-vault-500"
                        }`}
                      >
                        {badge.unlocked ? (
                          <Trophy className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <h4
                        className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${
                          badge.unlocked ? "text-gold-400" : "text-vault-400"
                        }`}
                      >
                        {badge.name}
                      </h4>
                      <p className="text-[10px] text-vault-400 leading-tight">
                        {badge.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
