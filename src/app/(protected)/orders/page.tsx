"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle,
  Package, AlertTriangle, ChevronRight, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useMyTransactions, useUpdateTransactionStatus } from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import type { DbTransaction } from "@/types/database";

const STATUS_CONFIG: Record<
  DbTransaction["status"],
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending:   { label: "Pending",   color: "#facc15", bg: "rgba(250,204,21,0.1)",   icon: Clock },
  shipped:   { label: "Shipped",   color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   icon: Package },
  completed: { label: "Completed", color: "#4ade80", bg: "rgba(74,222,128,0.1)",   icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "rgba(156,163,175,0.1)",  icon: AlertTriangle },
  disputed:  { label: "Disputed",  color: "#f87171", bg: "rgba(248,113,113,0.1)",  icon: AlertTriangle },
};

const GAME_COLORS: Record<string, string> = {
  "Pokémon":              "#ef4444",
  "Magic: The Gathering": "#3b82f6",
  "One Piece":            "#eab308",
  "Yu-Gi-Oh!":            "#a855f7",
};

type TabType = "all" | "purchases" | "sales";

export default function OrdersPage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useMyTransactions();
  const { mutateAsync: updateStatus, isPending: updating } = useUpdateTransactionStatus();
  const [tab, setTab] = useState<TabType>("all");

  const filtered = (transactions ?? []).filter((t) => {
    if (tab === "purchases") return t.buyer_id === user?.id;
    if (tab === "sales")     return t.seller_id === user?.id;
    return true;
  });

  const handleMarkShipped = async (txn: DbTransaction) => {
    try {
      await updateStatus({ transactionId: txn.id, status: "shipped" });
      toast.success("Marked as shipped!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkComplete = async (txn: DbTransaction) => {
    try {
      await updateStatus({ transactionId: txn.id, status: "completed" });
      toast.success("Transaction completed!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-vault-900">
      <div className="max-w-4xl mx-auto py-10 px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-6 h-6 text-gold-400" />
            <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
          </div>
          <p className="text-gray-500 text-sm">Your purchase and sale history</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-vault-800/60 border border-gray-700/40 rounded-xl mb-6 w-fit">
          {(["all", "purchases", "sales"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "bg-vault-700 text-white border border-gray-600/40"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "purchases" && <ArrowDownLeft className="w-3.5 h-3.5" />}
              {t === "sales"     && <ArrowUpRight  className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-vault-800/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No orders yet</p>
            <Link
              href="/market"
              className="inline-flex items-center gap-1.5 text-sm text-gold-400 hover:text-gold-300 transition-colors"
            >
              Browse the Market <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((txn, i) => {
              const cfg = STATUS_CONFIG[txn.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const isBuyer = txn.buyer_id === user?.id;
              const gameColor = GAME_COLORS[txn.game] ?? "#d4af37";

              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-vault-800/60 border border-gray-700/40 rounded-2xl overflow-hidden hover:border-gray-600/40 transition-colors"
                >
                  <div className="p-5 flex items-start gap-4">
                    {/* Direction badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isBuyer ? "bg-green-500/10" : "bg-blue-500/10"
                      }`}
                    >
                      {isBuyer ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    {/* Card info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{txn.card_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: gameColor, background: `${gameColor}18` }}
                            >
                              {txn.game}
                            </span>
                            <span className="text-[11px] text-gray-600 capitalize">{txn.condition.replace("_", " ")}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1">
                            {isBuyer ? (
                              <>Seller: <span className="text-gray-400">{txn.seller_username ?? "Anonymous"}</span></>
                            ) : (
                              <>Buyer: <span className="text-gray-400">{txn.buyer_username ?? "Anonymous"}</span></>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-gold-400 text-lg">
                            €{Number(txn.final_price).toFixed(2)}
                          </p>
                          <div
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-[10px] text-gray-700 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(txn.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {txn.offer_id && (
                          <span className="ml-2 text-blue-400/50 flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> via offer
                          </span>
                        )}
                      </p>

                      {/* Action buttons */}
                      {txn.status === "pending" && !isBuyer && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleMarkShipped(txn)}
                            disabled={updating}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Mark as Shipped
                          </button>
                        </div>
                      )}

                      {txn.status === "shipped" && isBuyer && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleMarkComplete(txn)}
                            disabled={updating}
                            className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-medium hover:bg-green-500/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirm Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
