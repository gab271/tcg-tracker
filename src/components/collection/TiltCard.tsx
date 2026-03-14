"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

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

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Rotate based on mouse position
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Shimmer effect calculation based on position
  const shimmerTranslateX = useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]);
  const shimmerTranslateY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "-100%"]);

  // Glare effect based on position — must be declared here, not inside JSX
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["-50%", "50%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["-50%", "50%"]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Normalize coordinates from -0.5 to 0.5
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div className="flex flex-col gap-3 group perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[63/88] rounded-xl cursor-pointer transition-all duration-200 ease-out"
      >
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl bg-vault-800 vault-border pointer-events-none"
          style={{
            boxShadow: isHovered 
              ? "0 25px 50px -12px rgba(212, 175, 55, 0.25), 0 0 15px rgba(212, 175, 55, 0.15)" 
              : "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Card Image Placeholder / We'd use Next Image for real cards */}
          <div className="relative w-full h-full p-2 bg-vault-900 border border-gray-800">
            <div className="absolute inset-2 border border-gray-700 rounded-lg flex flex-col pt-3 px-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
                <span className="text-white font-bold text-xs truncate max-w-[70%]">{card.name}</span>
                <span className="text-red-400 font-bold text-[10px]">120 HP</span>
              </div>
              <div className="flex-1 bg-gray-800 border-2 border-gray-700 rounded mb-2 overflow-hidden relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-mono">Image data</span>
                 </div>
              </div>
              <div className="h-16 flex flex-col justify-between mb-2">
                 <p className="text-[8px] text-gray-400 leading-tight">Does 100 damage. Flip a coin, if heads the opponent goes to sleep.</p>
              </div>
              <div className="flex justify-between items-center text-[8px] text-gray-500 mt-auto border-t border-gray-700 pt-1">
                 <span>Illus. Arita</span>
                 <span>004/102 ★</span>
              </div>
            </div>
            
            {/* Real image would be here */}
            {card.image && (
              <img 
                src={card.image} 
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover rounded-md opacity-20"
                loading="lazy"
              />
            )}
            
            {/* Holographic overlay */}
            {isHovered && (
              <motion.div 
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10"
                style={{
                  background: "linear-gradient(115deg, transparent 20%, rgba(212, 175, 55, 0.4) 30%, rgba(255, 255, 255, 0.5) 45%, rgba(64, 224, 208, 0.4) 50%, rgba(255, 105, 180, 0.3) 60%, transparent 80%)",
                  backgroundSize: "200% 200%",
                  x: shimmerTranslateX,
                  y: shimmerTranslateY,
                }}
              />
            )}
            
            {/* Soft glare on hover */}
            {isHovered && (
              <motion.div 
                className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
                style={{
                  background: "radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 60%)",
                  x: glareX,
                  y: glareY,
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Card Metadata info under the visual block */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white mb-0.5 truncate max-w-[150px]">{card.name}</h4>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{card.game} • {card.rarity}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gold-400 font-mono font-bold text-sm">
            ${card.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] bg-vault-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
            x{card.quantity}
          </span>
        </div>
      </div>
    </div>
  );
}
