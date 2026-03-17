"use client";

import { motion } from "framer-motion";
import { Check, X, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { useListingOffers, useAcceptOffer, useRejectOffer } from "@/hooks/use-transactions";
import type { DbOffer } from "@/types/database";

const STATUS_CONFIG: Record<
  DbOffer["status"],
  { label: string; color: string; bg: string }
> = {
  pending:   { label: "Pending",   color: "#facc15", bg: "rgba(250,204,21,0.1)" },
  accepted:  { label: "Accepted",  color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  rejected:  { label: "Rejected",  color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  withdrawn: { label: "Withdrawn", color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  expired:   { label: "Expired",   color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

interface OffersPanelProps {
  listingId: string;
}

export default function OffersPanel({ listingId }: OffersPanelProps) {
  const { data: offers, isLoading } = useListingOffers(listingId);
  const { mutateAsync: acceptOffer, isPending: accepting } = useAcceptOffer();
  const { mutateAsync: rejectOffer, isPending: rejecting } = useRejectOffer();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <p className="text-sm text-gray-600 text-center py-4">
        No offers received yet.
      </p>
    );
  }

  const handleAccept = async (offer: DbOffer) => {
    try {
      await acceptOffer({ offerId: offer.id, listingId });
      toast.success(`Offer from ${offer.buyer_username ?? "buyer"} accepted! Transaction created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept offer");
    }
  };

  const handleReject = async (offer: DbOffer) => {
    try {
      await rejectOffer({ offerId: offer.id, listingId });
      toast.success("Offer rejected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject offer");
    }
  };

  return (
    <div className="space-y-2">
      {offers.map((offer) => {
        const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
        const expiresIn = Math.max(
          0,
          Math.floor((new Date(offer.expires_at).getTime() - Date.now()) / 3600000)
        );

        return (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 p-3.5 rounded-xl border"
            style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}20` }}
              >
                <User className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {offer.buyer_username ?? "Anonymous"}
                </p>
                {offer.message && (
                  <p className="text-[11px] text-gray-500 truncate">&ldquo;{offer.message}&rdquo;</p>
                )}
                {offer.status === "pending" && (
                  <p className="text-[10px] text-gray-600 flex items-center gap-0.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    Expires in {expiresIn}h
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-bold text-sm" style={{ color: cfg.color }}>
                €{Number(offer.offered_price).toFixed(2)}
              </span>

              {offer.status === "pending" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAccept(offer)}
                    disabled={accepting || rejecting}
                    title="Accept offer"
                    className="w-7 h-7 rounded-lg bg-green-500/15 hover:bg-green-500/30 border border-green-500/30 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </button>
                  <button
                    onClick={() => handleReject(offer)}
                    disabled={accepting || rejecting}
                    title="Reject offer"
                    className="w-7 h-7 rounded-lg bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              )}

              {offer.status !== "pending" && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {cfg.label}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
