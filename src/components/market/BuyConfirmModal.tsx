"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useBuyNow } from "@/hooks/use-transactions";
import type { DbMarketListing } from "@/types/database";

interface BuyConfirmModalProps {
  listing: DbMarketListing;
  open: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  played: "Played",
  damaged: "Damaged",
};

export default function BuyConfirmModal({
  listing,
  open,
  onClose,
  onSuccess,
}: BuyConfirmModalProps) {
  const { mutateAsync: buyNow, isPending } = useBuyNow();

  const handleConfirm = async () => {
    try {
      const transactionId = await buyNow({ listingId: listing.id });
      toast.success("Purchase confirmed! Contact the seller to arrange delivery.");
      onSuccess(transactionId);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      toast.error(msg);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
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
                  <ShoppingCart className="w-5 h-5 text-gold-400" />
                  <h2 className="font-display font-bold text-white text-lg">Confirm Purchase</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Card summary */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-vault-700/40 border border-gray-700/30">
                  {listing.card_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.card_image}
                      alt={listing.card_name}
                      className="w-14 h-20 object-contain rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{listing.card_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{listing.game}</p>
                    <p className="text-xs text-gray-500">
                      Condition: {CONDITION_LABELS[listing.condition] ?? listing.condition}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Seller: {listing.seller_username ?? "Anonymous"}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gold-500/8 border border-gold-500/20">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="font-display text-2xl font-bold text-gold-400">
                    €{listing.price.toFixed(2)}
                  </span>
                </div>

                {/* Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    This is a peer-to-peer transaction. After confirming, the listing will be marked
                    as sold and you can coordinate delivery with the seller through your Orders page.
                  </p>
                </div>

                {/* Buyer protection note */}
                <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  No payment is processed here — you arrange payment directly with the seller.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm transition-colors disabled:opacity-60 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                >
                  {isPending ? "Confirming…" : "Confirm Purchase"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
