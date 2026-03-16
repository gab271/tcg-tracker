"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
  Gamepad
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState<"FREE" | "PRO">("FREE");
  const [memberSince, setMemberSince] = useState<string>("");
  
  const [stats, setStats] = useState({
    totalCards: 0,
    totalValue: 0,
    mostValuableCard: null as any
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [deckCount, setDeckCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUserProfile() {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        if (!user) return;

        setUser(user);
        setEmail(user.email || "");
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setPlan(user.user_metadata?.plan || "FREE");
        
        if (user.created_at) {
          const date = new Date(user.created_at);
          setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }

        // Fetch collection and stats
        const { data: collection, error: collectionError } = await supabase
          .from("collections")
          .select("*, cards(*)")
          .eq("user_id", user.id)
          .order('created_at', { ascending: false });

        if (!collectionError && collection) {
          const totalCards = collection.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
          
          let totalValue = 0;
          let mostValuable = null;
          let highestPrice = 0;
          const uniqueGames = new Set<string>();

          collection.forEach(item => {
            const price = item.cards?.market_price || 0;
            totalValue += price * (item.quantity || 1);
            
            if (item.cards?.game) {
              uniqueGames.add(item.cards.game);
            }
            
            if (price > highestPrice) {
              highestPrice = price;
              mostValuable = item.cards;
            }
          });

          setStats({
            totalCards,
            totalValue,
            mostValuableCard: mostValuable
          });
          
          setRecentActivity(collection.slice(0, 5));
          setGames(Array.from(uniqueGames));
        }

        // Fetch deck count for badges
        const { count, error: deckError } = await supabase
          .from("decks")
          .select('*', { count: 'exact', head: true })
          .eq("user_id", user.id);
          
        if (!deckError && count !== null) {
          setDeckCount(count);
        }

      } catch (err: any) {
        console.error("Error loading profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    getUserProfile();
  }, [supabase]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      toast.success("Photo updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error uploading photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      if (!displayName.trim()) return;
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;
      
      toast.success("Name updated!");
      setIsEditingName(false);
    } catch (error: any) {
      toast.error(error.message || "Error updating name");
    } finally {
      setSaving(false);
    }
  };

  const upgradeToPro = async () => {
    try {
      setSaving(true);
      await supabase.auth.updateUser({
        data: { plan: "PRO" }
      });
      setPlan("PRO");
      toast.success("Welcome to PRO!");
    } catch (error: any) {
      toast.error("Failed to upgrade plan");
    } finally {
      setSaving(false);
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  // Badges Logic
  const collectorBadges = [
    {
      id: "first_card",
      name: "First Card",
      description: "Add a card to your collection",
      unlocked: stats.totalCards > 0
    },
    {
      id: "vault_starter",
      name: "Vault Starter",
      description: "Secure 10+ cards in your vault",
      unlocked: stats.totalCards >= 10
    },
    {
      id: "deck_builder",
      name: "Deck Builder",
      description: "Create your first deck",
      unlocked: deckCount > 0
    },
    {
      id: "market_explorer",
      name: "Market Explorer",
      description: "Visit the market to check prices",
      unlocked: true // For display purposes
    }
  ];

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
        
        {plan === "FREE" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={upgradeToPro}
            className="flex items-center gap-2 rounded-sm bg-gradient-to-r from-gold-600 to-gold-400 px-6 py-2.5 text-sm font-bold tracking-wider text-vault-950 shadow-[0_0_15px_rgba(212,160,23,0.3)] transition-all hover:shadow-[0_0_25px_rgba(212,160,23,0.5)] uppercase"
          >
            <Star className="h-4 w-4 fill-vault-950" />
            Upgrade to Pro
          </motion.button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - USER IDENTITY CARD */}
        <motion.div variants={itemVariants} className="lg:col-span-1 border vault-border bg-vault-900/50 backdrop-blur-sm rounded-sm relative overflow-hidden flex flex-col items-center p-8 h-fit">
          <div className="absolute top-0 inset-x-0 h-1 bg-gold-gradient opacity-80 block" />
          
          {/* Avatar Section with rotating border */}
          <div className="relative mb-6 group" onClick={handleAvatarClick}>
            <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#D4A017_360deg)] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-36 h-36 rounded-full border-4 border-vault-900 overflow-hidden flex items-center justify-center bg-gradient-to-br from-vault-800 to-vault-950 cursor-pointer z-10">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gold-gradient uppercase">
                  {displayName?.charAt(0) || email?.charAt(0) || "C"}
                </span>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-white mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase text-white">Change Photo</span>
                  </>
                )}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={uploadAvatar}
            />
          </div>

          {/* Identity Info */}
          <div className="w-full flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-2 h-10">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full max-w-[200px]">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="w-full bg-vault-950 border border-gold-500/50 rounded-sm py-1.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500 font-bold text-center"
                  />
                  <button 
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-1.5 bg-gold-500/20 text-gold-400 rounded-sm hover:bg-gold-500/40 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit name"
                >
                  <h2 className="text-2xl font-bold text-white group-hover:text-gold-400 transition-colors text-center">
                    {displayName || "Anonymous Collector"}
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
                {games.map(game => (
                  <div key={game} className="px-3 py-1.5 bg-vault-800/80 border vault-border rounded-sm text-xs font-bold text-vault-300 flex items-center gap-1.5">
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

        {/* RIGHT COLUMN - CONTENT & STATS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-lg font-bold tracking-widest uppercase text-white flex items-center gap-2 border-b vault-border pb-2">
              <TrendingUp className="w-5 h-5 text-gold-400" />
              Collection <span className="text-vault-400">Overview</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -2, borderColor: 'rgba(212,160,23,0.3)' }}
                className="bg-vault-900/50 backdrop-blur-sm border vault-border rounded-sm p-5 flex items-start gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-sm bg-vault-800 border vault-border flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-vault-400 mb-1">Total Cards</p>
                  <p className="text-2xl font-bold font-mono text-white">{stats.totalCards}</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2, borderColor: 'rgba(212,160,23,0.3)' }}
                className="bg-vault-900/50 backdrop-blur-sm border vault-border rounded-sm p-5 flex items-start gap-4 transition-all"
              >
                <div className="w-10 h-10 rounded-sm bg-vault-800 border vault-border flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-vault-400 mb-1">Total Value</p>
                  <p className="text-2xl font-bold font-mono text-white">
                    ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Combined Grid: Activity + Badges */}
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
                      <div key={item.id || idx} className="p-3.5 hover:bg-vault-800/50 transition-colors flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-1">{item.cards?.name || "Unknown"}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {item.cards?.game && (
                              <span className="text-[9px] uppercase font-bold tracking-wider text-vault-400 px-1.5 py-0.5 rounded-sm bg-vault-950 border vault-border">
                                {item.cards.game}
                              </span>
                            )}
                            <span className="text-[10px] text-vault-500 font-mono">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {item.cards?.market_price && (
                          <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1.5 rounded-sm border border-emerald-400/20">
                            ${item.cards.market_price.toFixed(2)}
                          </div>
                        )}
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
                        ? 'bg-vault-900 border-gold-500/40 shadow-[0_0_15px_rgba(212,160,23,0.1)] hover:shadow-[0_0_20px_rgba(212,160,23,0.2)]' 
                        : 'bg-vault-950/50 border-vault-800 opacity-60 grayscale'
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                        badge.unlocked ? 'bg-gold-500/20 text-gold-400' : 'bg-vault-800 text-vault-500'
                      }`}>
                        {badge.unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <h4 className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${
                        badge.unlocked ? 'text-gold-400' : 'text-vault-400'
                      }`}>
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
