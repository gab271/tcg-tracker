"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import { ChevronRight, Shield, Zap, Library } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || !cardsRef.current) return;

    // Subtle background parallax
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to(cardsRef.current, {
        x: xPos,
        y: yPos,
        duration: 1,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-vault-900 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(15,17,21,1)_60%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-gold-400/5 rounded-full blur-3xl xl:block hidden" />
      </div>

      <div className="container px-6 lg:px-12 relative z-10 mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left Column: Copy */}
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="h-px w-8 bg-gold-500" />
            <span className="text-gold-400 text-sm font-bold tracking-[0.2em] uppercase">
              The Ultimate Collector&apos;s Vault
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
          >
            Secure Your <br />
            <span className="text-gold-gradient">Rare TCG</span> Collection.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-xl"
          >
            Track Pokémon, Magic: The Gathering, and One Piece cards in a luxurious
            digital vault. Real-time market data, seamless deck building, and uncompromising security.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-vault-800 vault-border hover:bg-vault-700 vault-glow hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="relative z-10 text-gold-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                Open Your Vault
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/market"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white font-bold uppercase tracking-wider text-sm transition-all duration-300"
            >
              Explore Market
            </Link>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-6 pt-8 border-t border-gray-800/50"
          >
            {[
              { icon: Shield, text: "Bank-Grade Security" },
              { icon: Zap, text: "Real-Time Pricing" },
              { icon: Library, text: "Multi-TCG Support" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col gap-3">
                <feature.icon className="w-6 h-6 text-gold-500/80" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {feature.text}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column: Floating Cards Animation (GSAP Target) */}
        <div className="hidden lg:block relative h-[600px] w-full" ref={cardsRef}>
          {/* Card 1: Front/Main */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-72 h-[400px] rounded-xl bg-vault-800 vault-border vault-glow overflow-hidden shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent" />
            <div className="absolute inset-[2px] rounded-lg bg-vault-900 overflow-hidden flex flex-col p-4 border border-gray-800/50">
               <div className="h-48 rounded bg-gray-900 mb-4 animate-pulse relative overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
               </div>
               <div className="h-6 w-3/4 bg-gray-800 rounded mb-2" />
               <div className="h-4 w-1/2 bg-gray-800 rounded mb-6" />
               <div className="mt-auto flex justify-between items-end">
                 <div className="h-8 w-20 bg-gray-800 rounded" />
                 <div className="h-8 w-8 bg-gold-900/30 rounded-full border border-gold-500/30" />
               </div>
            </div>
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_20%,rgba(212,175,55,0.1)_40%,rgba(255,255,255,0.2)_50%,rgba(212,175,55,0.1)_60%,transparent_80%)]  mix-blend-overlay pointer-events-none" />
          </motion.div>

          {/* Card 2: Back Right */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 15 }}
            animate={{ opacity: 1, x: 0, rotate: 12 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute top-1/2 left-[60%] -translate-y-1/2 z-20 w-64 h-[360px] rounded-xl bg-vault-800 border border-gray-800 overflow-hidden shadow-xl"
          >
            <div className="absolute inset-[2px] rounded-lg bg-vault-900/90 p-4 opacity-50" />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          {/* Card 3: Back Left */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -25 }}
            animate={{ opacity: 1, x: 0, rotate: -20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute top-[40%] left-[20%] z-10 w-64 h-[360px] rounded-xl bg-vault-800 border border-gray-800 overflow-hidden shadow-xl"
          >
             <div className="absolute inset-[2px] rounded-lg bg-vault-900/90 p-4 opacity-50" />
             <div className="absolute inset-0 bg-black/60" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
