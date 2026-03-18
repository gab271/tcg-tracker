"use client";

/**
 * Muestra el avg rating de un vendedor con estrellas.
 * Se usa en ListingDetailClient y en la página de transacciones.
 */

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

interface SellerRatingBadgeProps {
  sellerId: string;
  size?: "sm" | "md";
}

export default function SellerRatingBadge({ sellerId, size = "sm" }: SellerRatingBadgeProps) {
  const { data } = useQuery({
    queryKey: ["seller-rating", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?seller_id=${sellerId}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ avg_rating: number | null; total_ratings: number }>;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  if (!data || data.total_ratings === 0) return null;

  const stars = Math.round(data.avg_rating ?? 0);
  const isSm = size === "sm";

  return (
    <div className={`flex items-center gap-1.5 ${isSm ? "text-[10px]" : "text-xs"}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${isSm ? "w-3 h-3" : "w-3.5 h-3.5"} ${
              i <= stars ? "text-gold-400 fill-gold-400" : "text-gray-700"
            }`}
          />
        ))}
      </div>
      <span className="text-gray-500 font-mono">
        {Number(data.avg_rating).toFixed(1)}
      </span>
      <span className="text-gray-700">
        ({data.total_ratings})
      </span>
    </div>
  );
}
