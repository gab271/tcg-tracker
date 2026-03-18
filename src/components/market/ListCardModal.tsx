"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Search, Tag, ChevronDown, Camera, Loader2 as Spin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/use-collection";
import { useCreateListing } from "@/hooks/use-market";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import type { DbCollection } from "@/types/database";

const CONDITIONS = [
  { value: "mint",      label: "Mint",      desc: "Perfect, unplayed",   color: "#22d3ee" },
  { value: "near_mint", label: "Near Mint", desc: "Minimal wear",        color: "#4ade80" },
  { value: "played",    label: "Played",    desc: "Visible wear",        color: "#facc15" },
  { value: "damaged",   label: "Damaged",   desc: "Heavy wear/creases",  color: "#f87171" },
];

interface ListCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ListCardModal({ isOpen, onClose }: ListCardModalProps) {
  const { user } = useAuth();
  const { data: collection = [], isLoading } = useCollection();
  const createListing = useCreateListing();

  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<DbCollection | null>(null);
  const [condition, setCondition] = useState("near_mint");
  const [price, setPrice] = useState("");
  const [step, setStep] = useState<"pick" | "details">("pick");

  // Fotos del vendedor
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return collection.filter(
      (c) => c.card_name.toLowerCase().includes(q) || c.game.toLowerCase().includes(q)
    );
  }, [collection, search]);

  const handleSelectCard = (card: DbCollection) => {
    setSelectedCard(card);
    setPrice(card.price > 0 ? card.price.toFixed(2) : "");
    setStep("details");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (photos.length >= 4) { toast.error("Maximum 4 photos per listing."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB."); return; }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path);

      setPhotos((prev) => [...prev, publicUrl]);
    } catch {
      toast.error("Failed to upload photo. Make sure the 'listing-photos' bucket exists in Supabase Storage.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !price || !user) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    try {
      await createListing.mutateAsync({
        sellerUsername: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? null,
        sellerAvatar: user.user_metadata?.avatar_url ?? null,
        collectionItemId: selectedCard.id,
        cardId: selectedCard.card_id,
        cardName: selectedCard.card_name,
        cardImage: selectedCard.card_image ?? undefined,
        game: selectedCard.game,
        rarity: selectedCard.rarity,
        condition,
        price: priceNum,
        photos,
      });
      toast.success(`${selectedCard.card_name} listed for €${priceNum.toFixed(2)}`);
      handleClose();
    } catch {
      toast.error("Failed to create listing. Please try again.");
    }
  };

  const handleClose = () => {
    setStep("pick");
    setSelectedCard(null);
    setSearch("");
    setCondition("near_mint");
    setPrice("");
    setPhotos([]);
    onClose();
  };

  const selectedCond = CONDITIONS.find((c) => c.value === condition)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-[#11141a] border border-white/8 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
            style={{ maxHeight: "88vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/25 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div>
                  <p className="text-[9px] text-gold-400/60 uppercase tracking-[0.2em] font-bold">
                    The Exchange
                  </p>
                  <h2 className="font-display text-base font-bold text-white leading-none">
                    {step === "pick" ? "Choose a Card" : "Set Your Price"}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Step: Pick a card */}
            {step === "pick" && (
              <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(88vh - 65px)" }}>
                {/* Search */}
                <div className="px-5 py-3 border-b border-white/6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your collection..."
                      autoFocus
                      className="w-full bg-[#0a0c10] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-gold-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Card list */}
                <div className="overflow-y-auto flex-1 px-3 py-3 space-y-1">
                  {isLoading ? (
                    <div className="py-12 text-center text-gray-600 text-sm">Loading collection…</div>
                  ) : filtered.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-gray-600 text-sm">
                        {collection.length === 0
                          ? "Your collection is empty. Add cards first."
                          : "No cards match your search."}
                      </p>
                    </div>
                  ) : (
                    filtered.map((card) => (
                      <motion.button
                        key={card.id}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectCard(card)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-transparent hover:border-white/8 transition-all text-left"
                      >
                        {card.card_image ? (
                          <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden bg-[#0a0c10]">
                            <Image
                              src={card.card_image}
                              alt={card.card_name}
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-11 flex-shrink-0 rounded bg-[#0a0c10] border border-white/8 flex items-center justify-center text-xs text-gray-700">
                            ?
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{card.card_name}</p>
                          <p className="text-[10px] text-gray-600 truncate">{card.game}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-mono font-bold text-gold-400">
                            €{card.price.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-700">×{card.quantity}</p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step: Set details */}
            {step === "details" && selectedCard && (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(88vh - 65px)" }}>
                <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
                  {/* Selected card preview */}
                  <div className="flex gap-4 p-3 rounded-xl bg-white/3 border border-white/8">
                    {selectedCard.card_image ? (
                      <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#0a0c10]">
                        <Image
                          src={selectedCard.card_image}
                          alt={selectedCard.card_name}
                          fill
                          className="object-contain"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-20 flex-shrink-0 rounded-lg bg-[#0a0c10] border border-white/8 flex items-center justify-center text-lg text-gray-700">◈</div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <p className="text-sm font-semibold text-white truncate">{selectedCard.card_name}</p>
                      <p className="text-[11px] text-gray-500">{selectedCard.game}</p>
                      {selectedCard.rarity && (
                        <p className="text-[10px] text-gray-700">{selectedCard.rarity}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setStep("pick")}
                        className="text-[10px] text-gold-500/70 hover:text-gold-400 transition-colors text-left mt-1 flex items-center gap-1"
                      >
                        <ChevronDown className="w-3 h-3 rotate-90" />
                        Change card
                      </button>
                    </div>
                  </div>

                  {/* Condition selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                      Condition
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCondition(c.value)}
                          className="relative p-2.5 rounded-xl border text-left transition-all duration-200"
                          style={{
                            background: condition === c.value ? `${c.color}10` : "rgba(255,255,255,0.02)",
                            borderColor: condition === c.value ? `${c.color}40` : "rgba(255,255,255,0.06)",
                          }}
                        >
                          <p className="text-xs font-bold" style={{ color: condition === c.value ? c.color : "#6b7280" }}>
                            {c.label}
                          </p>
                          <p className="text-[10px] text-gray-700 mt-0.5">{c.desc}</p>
                          {condition === c.value && (
                            <div
                              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                              style={{ background: c.color }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seller photos */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                      Photos <span className="text-gray-700 font-normal normal-case tracking-normal">(optional · max 4)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((url) => (
                        <div key={url} className="relative w-16 h-20 rounded-lg overflow-hidden group">
                          <img src={url} alt="card photo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(url)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}

                      {photos.length < 4 && (
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-16 h-20 rounded-lg border-2 border-dashed border-white/10 hover:border-gold-500/40 flex flex-col items-center justify-center gap-1 transition-colors text-gray-700 hover:text-gray-500 disabled:opacity-50"
                        >
                          {uploadingPhoto
                            ? <Spin className="w-4 h-4 animate-spin" />
                            : <Camera className="w-4 h-4" />}
                          <span className="text-[9px] uppercase tracking-wider">
                            {uploadingPhoto ? "…" : "Add"}
                          </span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Price input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                      Listing Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-500/60 font-mono font-bold text-sm">
                        €
                      </span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        required
                        autoFocus
                        className="w-full bg-[#0a0c10] border border-white/8 rounded-xl pl-8 pr-4 py-3 text-sm text-white font-mono placeholder:text-gray-700 focus:outline-none focus:border-gold-500/40 transition-colors"
                      />
                    </div>
                    {selectedCard.price > 0 && (
                      <p className="text-[10px] text-gray-700 mt-1.5">
                        Market reference: €{selectedCard.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  {price && parseFloat(price) > 0 && (
                    <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
                      <p className="text-xs text-gray-500">
                        Listing{" "}
                        <span className="text-white font-medium">{selectedCard.card_name}</span>{" "}
                        in{" "}
                        <span style={{ color: selectedCond.color }} className="font-medium">
                          {selectedCond.label}
                        </span>{" "}
                        condition for{" "}
                        <span className="text-gold-400 font-mono font-bold">
                          €{parseFloat(price).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-5 py-4 border-t border-white/6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={createListing.isPending || !price || parseFloat(price) <= 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createListing.isPending ? "Listing…" : "List Card"}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
