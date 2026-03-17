"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useMakeOffer } from "@/hooks/use-transactions";
import type { DbMarketListing } from "@/types/database";

interface MakeOfferModalProps {
  listing: DbMarketListing;
  open: boolean;
  onClose: () => void;
}

export default function MakeOfferModal({ listing, open, onClose }: MakeOfferModalProps) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const { mutateAsync: makeOffer, isPending } = useMakeOffer();

  const askingPrice = listing.price;
  const offerNum = parseFloat(price);
  const isValid = !isNaN(offerNum) && offerNum > 0;
  const pctOfAsking = isValid ? Math.round((offerNum / askingPrice) * 100) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await makeOffer({
        listingId: listing.id,
        sellerId: listing.seller_id,
        offeredPrice: offerNum,
        message: message.trim() || undefined,
      });
      toast.success("Offer sent! The seller has 48 hours to respond.");
      onClose();
      setPrice("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send offer");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-vault-800 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/40">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-5 h-5 text-blue-400" />
                  <h2 className="font-display font-bold text-white text-lg">Make an Offer</h2>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Card + asking price */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-vault-700/40 border border-gray-700/30">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{listing.card_name}</p>
                    <p className="text-xs text-gray-500">{listing.game}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide">Asking</p>
                    <p className="font-mono font-bold text-gold-400">€{askingPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Price input */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">
                    Your Offer (€)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400 font-bold">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={askingPrice.toFixed(2)}
                      className="w-full pl-8 pr-4 py-3 bg-vault-700 border border-gray-600 focus:border-blue-500 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none transition-colors"
                      required
                    />
                    {pctOfAsking !== null && (
                      <span
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold ${
                          pctOfAsking >= 100
                            ? "text-green-400"
                            : pctOfAsking >= 80
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {pctOfAsking}%
                      </span>
                    )}
                  </div>
                  {pctOfAsking !== null && pctOfAsking < 50 && (
                    <p className="text-xs text-red-400 mt-1">
                      Very low offer — seller may decline.
                    </p>
                  )}
                </div>

                {/* Optional message */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 uppercase tracking-wide">
                    <MessageSquare className="w-3 h-3" />
                    Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={300}
                    rows={2}
                    placeholder="Introduce yourself or explain your offer…"
                    className="w-full px-3.5 py-2.5 bg-vault-700 border border-gray-600 focus:border-blue-500 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none resize-none transition-colors"
                  />
                  <p className="text-[10px] text-gray-700 text-right mt-0.5">
                    {message.length}/300
                  </p>
                </div>

                <p className="text-[11px] text-gray-600">
                  The seller has <strong className="text-gray-500">48 hours</strong> to accept or reject.
                  You can withdraw your offer at any time before a response.
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={!isValid || isPending}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Sending…" : "Send Offer"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
