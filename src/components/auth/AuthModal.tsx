"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

/* Partículas flotantes decorativas en el panel del video */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 4,
  duration: Math.random() * 6 + 8,
}));

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultMode === "login");
      setError(null);
      setSuccess(null);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      /* Reiniciar video al abrir */
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isOpen, defaultMode]);

  /* Bloquear scroll mientras el modal está abierto */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Revisa tu email para confirmar tu cuenta.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/api/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Ha ocurrido un error");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(3,4,8,0.88)", backdropFilter: "blur(14px)" }}
          />

          {/* ── Modal container ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full px-4"
            style={{ maxWidth: 880 }}
          >
            <div
              className="relative flex rounded-2xl overflow-hidden"
              style={{
                background: "#07090f",
                boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,132,26,0.14), inset 0 1px 0 rgba(255,255,255,0.04)",
                minHeight: 560,
              }}
            >

              {/* ════════════════════════════════════
                  PANEL IZQUIERDO — Video cinematic
              ════════════════════════════════════ */}
              <div className="relative hidden md:flex flex-col w-[45%] shrink-0 overflow-hidden">

                {/* Video de fondo */}
                <video
                  ref={videoRef}
                  src="/login.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: "brightness(0.55) saturate(1.1)" }}
                />

                {/* Overlay gradient multi-capa */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(7,9,15,0.55) 0%, transparent 35%, transparent 60%, rgba(7,9,15,0.9) 100%),
                      linear-gradient(90deg, transparent 60%, rgba(7,9,15,0.85) 100%),
                      radial-gradient(ellipse 80% 60% at 50% 40%, rgba(212,132,26,0.07) 0%, transparent 70%)
                    `,
                  }}
                />

                {/* Línea divisora derecha — efecto portal */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-[1px]"
                  style={{
                    background: "linear-gradient(180deg, transparent, rgba(212,132,26,0.5) 30%, rgba(212,132,26,0.8) 50%, rgba(212,132,26,0.5) 70%, transparent)",
                  }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-12"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(212,132,26,0.04))" }}
                />

                {/* Partículas flotantes */}
                {PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      background: p.size > 3 ? "rgba(212,132,26,0.7)" : "rgba(255,255,255,0.35)",
                    }}
                    animate={{
                      y: [-12, 12, -12],
                      opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Contenido del panel izquierdo */}
                <div className="relative z-10 flex flex-col h-full p-8 justify-between">

                  {/* Logo arriba */}
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center gap-2.5"
                  >
                    <img
                      src="/logoTcg.png"
                      alt="TCG Multiverse"
                      className="w-10 h-10 object-contain"
                      style={{ filter: "drop-shadow(0 0 10px rgba(212,132,26,0.5))" }}
                    />
                    <div className="flex flex-col leading-none">
                      <span
                        className="font-display text-xs font-bold tracking-[0.2em] uppercase"
                        style={{
                          background: "linear-gradient(135deg, #f5c050, #d4841a)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        TCG Multiverse
                      </span>
                      <span className="text-[8px] tracking-[0.28em] uppercase text-gray-500 mt-0.5">
                        Pokémon · YGO · Magic
                      </span>
                    </div>
                  </motion.div>

                  {/* Copy central */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.55 }}
                    className="space-y-4"
                  >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/8">
                      <Sparkles className="w-3 h-3 text-gold-400" />
                      <span className="text-[10px] text-gold-300 font-semibold tracking-[0.15em] uppercase">
                        Pokémon · YGO · Magic · One Piece
                      </span>
                    </div>

                    <h2
                      className="font-display text-3xl font-bold leading-tight text-white"
                      style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
                    >
                      Registra tus cartas.<br />
                      <span
                        style={{
                          background: "linear-gradient(135deg, #f5c050 0%, #d4841a 60%, #f97316 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        Conoce su valor.
                      </span>
                    </h2>

                    <p className="text-sm text-gray-400 leading-relaxed max-w-[220px]">
                      Lleva el control de tu colección, rastrea precios en tiempo real y construye mazos — todo en un solo lugar.
                    </p>
                  </motion.div>

                  {/* Stats decorativos abajo */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex gap-5"
                  >
                    {[
                      { value: "4", label: "Juegos soportados" },
                      { value: "+280K", label: "Cartas en la BD" },
                      { value: "Gratis", label: "Plan básico" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p
                          className="font-display text-lg font-bold"
                          style={{
                            background: "linear-gradient(135deg, #f5c050, #d4841a)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* ════════════════════════════════════
                  PANEL DERECHO — Formulario
              ════════════════════════════════════ */}
              <div className="flex-1 relative flex flex-col overflow-hidden">

                {/* Fondo sutil del panel derecho */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse 100% 80% at 80% 20%, rgba(212,132,26,0.04) 0%, transparent 60%)",
                  }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1px] md:hidden"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(212,132,26,0.7) 50%, transparent)" }}
                />

                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,132,26,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <div className="relative z-10 flex flex-col h-full px-8 py-8 justify-center">

                  {/* Logo visible solo en móvil */}
                  <div className="flex md:hidden items-center gap-2 mb-7">
                    <img src="/logoTcg.png" alt="TCG" className="w-8 h-8 object-contain" />
                    <span
                      className="font-display text-sm font-bold tracking-[0.18em] uppercase"
                      style={{
                        background: "linear-gradient(135deg, #f5c050, #d4841a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      TCG Multiverse
                    </span>
                  </div>

                  {/* ── Tab switcher ── */}
                  <div
                    className="flex p-1 rounded-xl mb-8"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {(["login", "register"] as const).map((mode) => {
                      const active = isLogin === (mode === "login");
                      return (
                        <button
                          key={mode}
                          onClick={() => { setIsLogin(mode === "login"); setError(null); setSuccess(null); }}
                          className="relative flex-1 py-2.5 text-xs font-bold tracking-[0.14em] uppercase transition-colors duration-200 z-10 rounded-lg"
                        >
                          {active && (
                            <motion.div
                              layoutId="auth-tab"
                              className="absolute inset-0 rounded-lg"
                              style={{
                                background: "linear-gradient(135deg, rgba(212,132,26,0.18), rgba(212,132,26,0.08))",
                                border: "1px solid rgba(212,132,26,0.25)",
                                boxShadow: "0 2px 12px rgba(212,132,26,0.12)",
                              }}
                              transition={{ type: "spring", damping: 22, stiffness: 300 }}
                            />
                          )}
                          <span
                            className="relative z-10 transition-colors duration-200"
                            style={{ color: active ? "#e8a030" : "rgba(255,255,255,0.25)" }}
                          >
                            {mode === "login" ? "Iniciar sesión" : "Registrarse"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Header ── */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isLogin ? "lh" : "rh"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="mb-7"
                    >
                      <h1 className="font-display text-2xl font-bold text-white mb-1.5 tracking-wide">
                        {isLogin ? "Bienvenido de vuelta" : "Empieza a coleccionar"}
                      </h1>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {isLogin
                          ? "Tus cartas te están esperando."
                          : "Crea tu cuenta gratis, sin tarjeta de crédito."}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* ── Alertas ── */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5 overflow-hidden"
                      >
                        <div
                          className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            color: "#fca5a5",
                          }}
                        >
                          <span className="shrink-0 mt-0.5" style={{ color: "rgba(248,113,113,0.7)" }}>⚠</span>
                          {error}
                        </div>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-5 overflow-hidden"
                      >
                        <div
                          className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                          style={{
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            color: "#86efac",
                          }}
                        >
                          <span className="shrink-0 mt-0.5" style={{ color: "rgba(74,222,128,0.7)" }}>✓</span>
                          {success}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Formulario ── */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] ml-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Email
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full h-12 rounded-xl pl-10 pr-4 text-sm text-white outline-none transition-all duration-200"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "white",
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = "rgba(212,132,26,0.5)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,132,26,0.07)";
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] ml-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isLogin ? "Tu contraseña" : "Mín. 8 caracteres"}
                          required
                          className="w-full h-12 rounded-xl pl-10 pr-11 text-sm text-white outline-none transition-all duration-200"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "white",
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = "rgba(212,132,26,0.5)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,132,26,0.07)";
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Olvidé mi contraseña */}
                    {isLogin && (
                      <div className="flex justify-end -mt-1">
                        <button
                          type="button"
                          className="text-[10px] tracking-wide transition-colors"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#e8a030"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}

                    {/* Botón submit */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full h-12 rounded-xl font-bold text-sm tracking-wider uppercase overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                        style={{
                          background: "linear-gradient(135deg, #d4841a 0%, #e8a030 50%, #f97316 100%)",
                          boxShadow: "0 0 24px rgba(212,132,26,0.25), 0 4px 16px rgba(0,0,0,0.3)",
                          color: "#07090f",
                        }}
                        onMouseEnter={e => {
                          if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(212,132,26,0.5), 0 4px 24px rgba(0,0,0,0.4)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(212,132,26,0.25), 0 4px 16px rgba(0,0,0,0.3)";
                        }}
                      >
                        {/* Shimmer effect */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s infinite",
                          }}
                        />
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          <span className="relative z-10">
                            {isLogin ? "Iniciar sesión" : "Crear cuenta gratis"}
                          </span>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* ── Divisor ── */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span
                        className="px-3 text-[10px] uppercase tracking-[0.18em]"
                        style={{ background: "#07090f", color: "rgba(255,255,255,0.2)" }}
                      >
                        o continúa con
                      </span>
                    </div>
                  </div>

                  {/* ── Google ── */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-11 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "rgba(255,255,255,0.65)",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = "rgba(255,255,255,0.07)";
                      el.style.borderColor = "rgba(255,255,255,0.15)";
                      el.style.color = "white";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = "rgba(255,255,255,0.04)";
                      el.style.borderColor = "rgba(255,255,255,0.09)";
                      el.style.color = "rgba(255,255,255,0.65)";
                    }}
                  >
                    {/* Google logo */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </button>

                  {/* ── Cambio de modo ── */}
                  <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {isLogin ? "¿Nuevo en TCG Multiverse?" : "¿Ya tienes una cuenta?"}{" "}
                    <button
                      onClick={switchMode}
                      className="font-semibold transition-colors"
                      style={{ color: "rgba(212,132,26,0.8)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#e8a030"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,132,26,0.8)"; }}
                    >
                      {isLogin ? "Crear una cuenta" : "Inicia sesión"}
                    </button>
                  </p>

                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
