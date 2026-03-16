"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    }
  }, [isOpen, defaultMode]);

  // Lock scroll when modal is open
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
        setSuccess("Check your email to confirm your account.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
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
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] z-[101] mx-4"
          >
            <div className="relative bg-vault-900 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(212,175,55,0.12)]">

              {/* Top gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/80 to-transparent" />

              {/* Atmospheric background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

              {/* Decorative card-back pattern */}
              <div
                className="absolute inset-0 opacity-[0.018] pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(-45deg, #d4af37 0, #d4af37 1px, transparent 0, transparent 28px)`,
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-vault-700/60 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative px-8 pt-8 pb-8">

                {/* ── Mode Toggle ── */}
                <div className="flex items-center bg-vault-800/80 border border-gray-800/80 rounded-xl p-1 mb-8">
                  {(["login", "register"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setIsLogin(mode === "login"); setError(null); setSuccess(null); }}
                      className="relative flex-1 py-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 z-10"
                    >
                      {isLogin === (mode === "login") && (
                        <motion.div
                          layoutId="auth-tab-bg"
                          className="absolute inset-0 rounded-lg bg-vault-700 border border-gold-500/20 shadow-sm"
                          transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors duration-200 ${
                        isLogin === (mode === "login") ? "text-gold-400" : "text-gray-600"
                      }`}>
                        {mode === "login" ? "Sign In" : "Sign Up"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ── Header ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? "login-header" : "register-header"}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="mb-7"
                  >
                    <h2 className="font-display text-2xl font-bold text-white mb-1.5">
                      {isLogin ? "Welcome back" : "Create your vault"}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {isLogin
                        ? "Enter your credentials to access your collection."
                        : "Start tracking your cards for free, no credit card needed."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* ── Feedback ── */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-5 overflow-hidden"
                    >
                      <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-500/25 text-red-300 text-sm flex items-start gap-2">
                        <span className="mt-0.5 text-red-400/70 shrink-0">⚠</span>
                        {error}
                      </div>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-5 overflow-hidden"
                    >
                      <div className="px-4 py-3 rounded-xl bg-green-950/50 border border-green-500/25 text-green-300 text-sm flex items-start gap-2">
                        <span className="mt-0.5 text-green-400/70 shrink-0">✓</span>
                        {success}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Form ── */}
                <form onSubmit={handleEmailAuth} className="space-y-3">

                  {/* Email */}
                  <div className="group">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-1.5 ml-1 group-focus-within:text-gold-500/80 transition-colors">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold-500/60 transition-colors pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full h-11 bg-vault-800/80 border border-gray-800 focus:border-gold-500/50 focus:bg-vault-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-gray-700 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="group">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-1.5 ml-1 group-focus-within:text-gold-500/80 transition-colors">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold-500/60 transition-colors pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? "Your password" : "Min. 8 characters"}
                        required
                        className="w-full h-11 bg-vault-800/80 border border-gray-800 focus:border-gold-500/50 focus:bg-vault-800 rounded-xl pl-10 pr-11 text-sm text-white placeholder:text-gray-700 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password (login only) */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" className="text-[10px] text-gray-600 hover:text-gold-400/80 tracking-wide transition-colors pt-0.5">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-vault-900 font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_28px_rgba(212,175,55,0.38)] group"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{isLogin ? "Sign In" : "Create Account"}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* ── Divider ── */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800/80" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-vault-900 px-3 text-[10px] uppercase tracking-[0.15em] text-gray-600">
                      or
                    </span>
                  </div>
                </div>

                {/* ── Google ── */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-vault-800/80 border border-gray-800 hover:border-gray-700 hover:bg-vault-700/60 disabled:opacity-60 disabled:cursor-not-allowed text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2.5"
                >
                  {/* Google logo */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                {/* ── Mode switch ── */}
                <p className="text-center text-xs text-gray-600 mt-6">
                  {isLogin ? "New to TCG Tracker?" : "Already have a vault?"}{" "}
                  <button
                    onClick={switchMode}
                    className="text-gold-400/80 hover:text-gold-300 font-medium transition-colors underline-offset-2 hover:underline"
                  >
                    {isLogin ? "Create an account" : "Sign in"}
                  </button>
                </p>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
