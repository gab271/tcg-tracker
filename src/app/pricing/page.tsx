"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, Zap, Shield, Sparkles, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const FREE_FEATURES = [
  "Hasta 100 cartas en tu colección",
  "Hasta 3 mazos",
  "Hasta 5 listings activos en el mercado",
  "Búsqueda en 4 juegos (Pokémon, MTG, YGO, OP)",
  "Price alerts básicas",
  "Perfil público compartible",
  "Exportar colección CSV/JSON",
];

const PRO_FEATURES = [
  "Colección ilimitada",
  "Mazos ilimitados",
  "Listings ilimitados en el mercado",
  "Historial de valor del portfolio",
  "Set completion tracker",
  "Notificaciones en tiempo real",
  "Análisis avanzado de precios",
  "Soporte prioritario",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        // No autenticado — redirigir al dashboard que abrirá el auth modal
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("No se pudo iniciar el proceso de pago. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vault-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/4 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='48' viewBox='0 0 56 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 1L55 16v16L28 47 1 32V16Z' fill='none' stroke='%23d4af37' stroke-width='0.6'/%3E%3C/svg%3E")`,
            backgroundSize: "56px 48px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-16 pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/8 border border-gold-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-xs font-bold text-gold-400 uppercase tracking-[0.2em]">
              Planes
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-wide mb-4">
            Elige tu plan
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Empieza gratis. Actualiza cuando necesites más potencia.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-2xl p-7 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-2">
                Free
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-mono">€0</span>
                <span className="text-gray-500 text-sm">/ mes</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">Perfecto para empezar</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="w-full h-11 rounded-xl flex items-center justify-center text-sm font-bold uppercase tracking-wider text-gray-400 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Continuar gratis
            </Link>
          </motion.div>

          {/* PRO */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl p-7 flex flex-col relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1c1608 0%, #0d1020 100%)",
              border: "2px solid rgba(212,175,55,0.4)",
              boxShadow: "0 0 60px rgba(212,175,55,0.08)",
            }}
          >
            {/* Shine */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,175,55,0.12),transparent_60%)] pointer-events-none" />
            <div className="absolute inset-[2px] rounded-xl border border-gold-500/10 pointer-events-none" />

            {/* Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30">
              <Zap className="w-3 h-3 text-gold-400" />
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">Popular</span>
            </div>

            <div className="relative z-10 mb-6">
              <p className="text-[10px] font-bold text-gold-500/70 uppercase tracking-[0.25em] mb-2">
                Pro
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-mono">€4.99</span>
                <span className="text-gray-500 text-sm">/ mes</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">Para el coleccionista serio</p>
            </div>

            <ul className="relative z-10 space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUpgrade}
              disabled={loading}
              className="relative z-10 w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-vault-900 transition-all shadow-[0_0_24px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #e5c048, #d4af37, #b8941e)" }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-vault-900/40 border-t-vault-900 rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Upgrade a Pro
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-10 text-xs text-gray-700"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Pagos seguros con Stripe
          </div>
          <div className="w-px h-3 bg-gray-800" />
          <span>Cancela en cualquier momento</span>
          <div className="w-px h-3 bg-gray-800" />
          <span>Sin permanencia</span>
        </motion.div>
      </div>
    </div>
  );
}
