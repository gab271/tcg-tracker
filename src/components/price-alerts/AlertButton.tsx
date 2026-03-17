"use client";

import { useState } from "react";
import { Bell, BellOff, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateAlert, useDeleteAlert, usePriceAlerts } from "@/hooks/use-price-alerts";
import { useAuth } from "@/hooks/use-auth";

interface AlertButtonProps {
  cardId: string;
  cardName: string;
  cardImage?: string;
  game: string;
  currentPrice?: number;
  className?: string;
}

export default function AlertButton({
  cardId,
  cardName,
  cardImage,
  game,
  currentPrice,
  className = "",
}: AlertButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? (currentPrice * 0.9).toFixed(2) : ""
  );
  const [direction, setDirection] = useState<"below" | "above">("below");

  const { data: alerts } = usePriceAlerts();
  const { mutateAsync: createAlert, isPending: creating } = useCreateAlert();
  const { mutateAsync: deleteAlert, isPending: deleting } = useDeleteAlert();

  if (!user) return null;

  const existingAlert = alerts?.find((a) => a.card_id === cardId && a.is_active);
  const price = parseFloat(targetPrice);

  const handleCreate = async () => {
    if (isNaN(price) || price <= 0) {
      toast.error("Enter a valid target price");
      return;
    }
    try {
      await createAlert({ cardId, cardName, cardImage, game, targetPrice: price, direction });
      toast.success("Price alert set! You'll be notified by email.");
      setOpen(false);
    } catch {
      toast.error("Failed to create alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      toast.success("Alert removed");
      setOpen(false);
    } catch {
      toast.error("Failed to remove alert");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={existingAlert ? "Alert active" : "Set price alert"}
        className={`flex items-center gap-1.5 transition-all duration-200 ${className}`}
      >
        {existingAlert ? (
          <Bell className="w-4 h-4 text-gold-400 fill-gold-400/30" />
        ) : (
          <Bell className="w-4 h-4 text-gray-500 hover:text-gold-400 transition-colors" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 z-50 w-72 bg-vault-800 border border-gray-700/60 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
                <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-gold-400" />
                  Price Alert
                </span>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {existingAlert ? (
                  <>
                    <div className="p-3 rounded-lg bg-gold-500/8 border border-gold-500/20">
                      <p className="text-xs text-gray-400 mb-1">Active alert</p>
                      <p className="text-sm font-bold text-gold-400 font-mono">
                        {existingAlert.direction === "below" ? "Below" : "Above"} €{Number(existingAlert.target_price).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(existingAlert.id)}
                      disabled={deleting}
                      className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      {deleting ? "Removing…" : "Remove Alert"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 truncate">{cardName}</p>

                    {/* Direction selector */}
                    <div className="flex gap-2">
                      {(["below", "above"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDirection(d)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            direction === d
                              ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                              : "border border-gray-700 text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {d === "below" ? "Price drops below" : "Price rises above"}
                        </button>
                      ))}
                    </div>

                    {/* Price input */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400 text-sm font-bold">€</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Target price"
                        className="w-full pl-7 pr-3 py-2.5 bg-vault-700 border border-gray-600 focus:border-gold-500 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none transition-colors"
                      />
                    </div>

                    {currentPrice && (
                      <p className="text-[10px] text-gray-600">
                        Current market price: <span className="text-gray-400 font-mono">€{currentPrice.toFixed(2)}</span>
                      </p>
                    )}

                    <button
                      onClick={handleCreate}
                      disabled={creating || !targetPrice}
                      className="w-full py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {creating ? "Setting…" : "Set Alert"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
