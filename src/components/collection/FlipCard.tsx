"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FlipCardProps {
  frontImage: string;
  backImage?: string;
  name: string;
}

export default function FlipCard({ frontImage, backImage, name }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Mouse tracking for holographic shimmer
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-12deg", "12deg"]);
  const shimmerX = useTransform(springX, [-0.5, 0.5], ["-150%", "150%"]);
  const shimmerY = useTransform(springY, [-0.5, 0.5], ["150%", "-150%"]);
  const glareX = useTransform(springX, [-0.5, 0.5], ["-60%", "60%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["-60%", "60%"]);

  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const defaultBack = (
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-vault-800 via-vault-900 to-vault-800 border border-gold-500/20 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {/* Pattern grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(212,175,55,0.1) 0px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(212,175,55,0.1) 0px, transparent 1px, transparent 20px)"
        }} />
      </div>
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="w-20 h-20 rounded-full border-2 border-gold-500/30 flex items-center justify-center bg-vault-800">
          <span className="text-gold-400 text-2xl font-bold">TCG</span>
        </div>
        <p className="text-gold-500/50 text-sm uppercase tracking-[0.3em] font-medium">Vault Edition</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative cursor-pointer"
        style={{ perspective: "1200px", width: "320px", height: "448px" }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            rotateX: isHovering ? rotateX : 0,
            rotateY: isFlipped ? 180 : (isHovering ? rotateY : 0),
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            <div
              className="w-full h-full rounded-2xl overflow-hidden relative"
              style={{
                boxShadow: isHovering
                  ? "0 40px 80px -20px rgba(212, 175, 55, 0.3), 0 0 30px rgba(212, 175, 55, 0.15)"
                  : "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
                transition: "box-shadow 0.3s ease",
              }}
            >
              {frontImage ? (
                <img
                  src={frontImage}
                  alt={name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-vault-800 border border-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image Available</span>
                </div>
              )}

              {/* Holographic shimmer overlay */}
              {isHovering && (
                <motion.div
                  className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10"
                  style={{
                    background: "linear-gradient(115deg, transparent 15%, rgba(212, 175, 55, 0.5) 25%, rgba(255, 255, 255, 0.6) 40%, rgba(64, 224, 208, 0.5) 48%, rgba(255, 105, 180, 0.4) 55%, rgba(138, 43, 226, 0.3) 65%, transparent 85%)",
                    backgroundSize: "250% 250%",
                    x: shimmerX,
                    y: shimmerY,
                  }}
                />
              )}

              {/* Glare spot */}
              {isHovering && (
                <motion.div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 55%)",
                    x: glareX,
                    y: glareY,
                  }}
                />
              )}
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden relative"
              style={{
                boxShadow: isHovering
                  ? "0 40px 80px -20px rgba(212, 175, 55, 0.3), 0 0 30px rgba(212, 175, 55, 0.15)"
                  : "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
              }}
            >
              {backImage ? (
                <img src={backImage} alt={`${name} back`} className="w-full h-full object-cover" draggable={false} />
              ) : (
                defaultBack
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <p className="text-gray-500 text-xs uppercase tracking-widest animate-pulse">
        Click to {isFlipped ? "show front" : "flip card"}
      </p>
    </div>
  );
}
