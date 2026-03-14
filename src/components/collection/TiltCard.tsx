"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

interface TiltCardProps {
  card: {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    game: string;
    rarity: string;
  };
}

export default function TiltCard({ card }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const shimmerTranslateX = useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]);
  const shimmerTranslateY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["-50%", "50%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["-50%", "50%"]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div className="flex flex-col gap-3 group" style={{ perspective: "1000px" }}>
      <Link href={`/collection/${card.id}`}>
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full aspect-[63/88] rounded-xl cursor-pointer"
        >
          <div
            className="absolute inset-0 rounded-xl overflow-hidden bg-vault-800 vault-border"
            style={{
              boxShadow: isHovered
                ? "0 25px 50px -12px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.15)"
                : "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* Card Image — the real one, full size */}
            {card.image ? (
              <img
                src={card.image}
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-vault-900 border border-gray-800 rounded-xl">
                <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-3 bg-vault-800">
                  <span className="text-gold-500/30 text-lg font-bold">?</span>
                </div>
                <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{card.name}</span>
              </div>
            )}

            {/* Holographic shimmer overlay */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10 rounded-xl"
                style={{
                  background: "linear-gradient(115deg, transparent 15%, rgba(212, 175, 55, 0.5) 25%, rgba(255, 255, 255, 0.6) 40%, rgba(64, 224, 208, 0.5) 48%, rgba(255, 105, 180, 0.4) 55%, rgba(138, 43, 226, 0.3) 65%, transparent 85%)",
                  backgroundSize: "250% 250%",
                  x: shimmerTranslateX,
                  y: shimmerTranslateY,
                }}
              />
            )}

            {/* Soft glare */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-overlay z-20 rounded-xl"
                style={{
                  background: "radial-gradient(circle at center, rgba(255,255,255,0.45) 0%, transparent 55%)",
                  x: glareX,
                  y: glareY,
                }}
              />
            )}
          </div>
        </motion.div>
      </Link>

      {/* Card Metadata */}
      <Link href={`/collection/${card.id}`} className="flex justify-between items-start hover:opacity-80 transition-opacity">
        <div className="flex flex-col min-w-0">
          <h4 className="text-sm font-bold text-white mb-0.5 truncate">{card.name}</h4>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{card.game} • {card.rarity}</span>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-2">
          <span className="text-gold-400 font-mono font-bold text-sm">
            ${card.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] bg-vault-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
            x{card.quantity}
          </span>
        </div>
      </Link>
    </div>
  );
}
