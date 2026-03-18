"use client";

/**
 * Modal para valorar al vendedor tras completar una transacción.
 * Se muestra en la página de órdenes (/orders) cuando status === "completed".
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RateSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  sellerId: string;
  sellerName: string;
  cardName: string;
  onRated?: () => void;
}

export default function RateSellerModal({
  isOpen, onClose, transactionId, sellerId, sellerName, cardName, onRated,
}: RateSellerModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: transactionId, seller_id: sellerId, rating, comment: comment || undefined }),
      });
      if (res.status === 409) { toast.info("You've already rated this transaction."); onClose(); return; }
      if (!res.ok) throw new Error("Failed to submit rating");
      toast.success("Rating submitted. Thanks!");
      onRated?.();
      onClose();
    } catch {
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayStars = hovered || rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm bg-[#11141a] border border-white/8 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div>
                <p className="text-[9px] text-gold-400/60 uppercase tracking-[0.2em] font-bold">Rate Seller</p>
                <h2 className="font-display text-base font-bold text-white leading-none mt-0.5">
                  How was {sellerName}?
                </h2>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Card info */}
              <p className="text-xs text-gray-500">
                Purchase: <span className="text-gray-300">{cardName}</span>
              </p>

              {/* Star rating */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Your rating</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(i)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          i <= displayStars ? "text-gold-400 fill-gold-400" : "text-gray-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-600 mt-2">
                  {displayStars === 0 ? "Select a rating" :
                   displayStars === 1 ? "Poor" :
                   displayStars === 2 ? "Fair" :
                   displayStars === 3 ? "Good" :
                   displayStars === 4 ? "Great" : "Excellent!"}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Comment <span className="font-normal normal-case text-gray-700">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe your experience…"
                  className="w-full bg-[#0a0c10] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-gold-500/40 transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={loading || rating === 0}
                  className="flex-1 h-10 rounded-xl text-sm font-bold text-vault-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #f6d159, #d4af37)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-vault-900" />}
                  {loading ? "Submitting…" : "Submit Rating"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
