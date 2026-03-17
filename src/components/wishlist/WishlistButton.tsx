"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useIsWishlisted, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";

interface WishlistButtonProps {
  cardId: string;
  cardName: string;
  cardImage?: string;
  game: string;
  /** If true, show a label next to the icon */
  showLabel?: boolean;
  className?: string;
}

export default function WishlistButton({
  cardId,
  cardName,
  cardImage,
  game,
  showLabel = false,
  className = "",
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { data: existing, isLoading } = useIsWishlisted(cardId);
  const { mutateAsync: add, isPending: adding } = useAddToWishlist();
  const { mutateAsync: remove, isPending: removing } = useRemoveFromWishlist();

  if (!user) return null;

  const inWishlist = !!existing;
  const busy = isLoading || adding || removing;

  const handleToggle = async () => {
    if (busy) return;

    if (inWishlist && existing) {
      try {
        await remove({ itemId: existing.id, cardId });
        toast.success("Removed from wishlist");
      } catch {
        toast.error("Failed to remove from wishlist");
      }
    } else {
      try {
        await add({ cardId, cardName, cardImage, game });
        toast.success("Added to wishlist!");
      } catch {
        toast.error("Failed to add to wishlist");
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all ${
          inWishlist
            ? "fill-red-500 text-red-500 scale-110"
            : "text-gray-500 hover:text-red-400"
        }`}
      />
      {showLabel && (
        <span className={`text-xs ${inWishlist ? "text-red-400" : "text-gray-500"}`}>
          {inWishlist ? "Wishlisted" : "Wishlist"}
        </span>
      )}
    </button>
  );
}
