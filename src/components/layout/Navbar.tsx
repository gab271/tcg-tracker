"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Settings, ChevronDown, LayoutDashboard, Library, Layers, TrendingUp } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Collection", path: "/collection", icon: Library },
  { name: "Decks", path: "/decks", icon: Layers },
  { name: "Market", path: "/market", icon: TrendingUp },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <>
      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      <header
        className={`fixed top-[2px] left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-vault-900/85 backdrop-blur-xl border-b border-gold-500/15 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between h-[72px]">

          {/* ── Logo ── */}
          <Link href="/" className="group flex items-center gap-3 z-50 shrink-0">
            {/* Logo mark */}
            <div className="relative w-9 h-9 rounded-lg border border-gold-500/40 bg-vault-800 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Stylized card stack icon */}
              <div className="relative flex flex-col gap-[3px] items-center">
                <div className="w-4 h-[3px] rounded-sm bg-gold-500/90" />
                <div className="w-5 h-[3px] rounded-sm bg-gold-400/70" />
                <div className="w-4 h-[3px] rounded-sm bg-gold-300/50" />
              </div>
            </div>
            {/* Wordmark */}
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-sm font-bold tracking-[0.18em] uppercase text-gold-gradient">
                TCG Tracker
              </span>
              <span className="text-[8px] tracking-[0.3em] uppercase text-gray-600 font-medium">
                Collector&apos;s Vault
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1">
            {isLoadingAuth ? (
              <div className="flex gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-20 h-4 bg-vault-700/40 animate-pulse rounded" />
                ))}
              </div>
            ) : user ? (
              NAV_LINKS.map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(link.path + "/");
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`relative px-3 py-2 rounded-md text-sm font-medium tracking-wider uppercase transition-all duration-200 group ${
                      isActive
                        ? "text-gold-400"
                        : "text-gray-500 hover:text-gray-200"
                    }`}
                  >
                    {/* Hover bg */}
                    <span className={`absolute inset-0 rounded-md transition-colors duration-200 ${
                      isActive ? "bg-gold-500/8" : "group-hover:bg-white/4"
                    }`} />
                    <span className="relative z-10">{link.name}</span>
                    {/* Active underline */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                      />
                    )}
                  </Link>
                );
              })
            ) : null}
          </nav>

          {/* ── Right Side ── */}
          <div className="hidden md:flex items-center gap-3">
            {isLoadingAuth ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-8 bg-vault-700/30 animate-pulse rounded" />
                <div className="w-28 h-9 bg-vault-700/30 animate-pulse rounded-md" />
              </div>
            ) : user ? (
              /* User avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-gray-800 hover:border-gold-500/30 bg-vault-800/60 hover:bg-vault-800 transition-all duration-200 group"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full border border-gold-500/40 bg-vault-700 flex items-center justify-center overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gold-400 font-bold text-xs">{userInitial}</span>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-vault-900 border border-gray-800/80 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1.5 z-50 overflow-hidden"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-800/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full border border-gold-500/30 bg-vault-700 flex items-center justify-center overflow-hidden shrink-0">
                            {user.user_metadata?.avatar_url ? (
                              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gold-400 font-bold text-xs">{userInitial}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {user.user_metadata?.display_name || "Collector"}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-vault-800/70 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-gray-500" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-vault-800/70 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-gray-500" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-gray-800/60 pt-1 pb-0.5">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-900/15 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Auth buttons */
              <>
                <button
                  onClick={() => { setAuthMode("login"); setIsAuthOpen(true); }}
                  className="text-sm font-medium text-gray-400 hover:text-white tracking-wide transition-colors px-2 py-1"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode("register"); setIsAuthOpen(true); }}
                  className="relative group px-5 py-2 rounded-md bg-vault-800 border border-gold-500/30 hover:border-gold-500/60 text-gold-400 text-sm font-medium tracking-wide transition-all duration-200 shadow-[0_0_12px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-500/8 to-gold-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Open Vault</span>
                </button>
              </>
            )}
          </div>

          {/* ── Mobile Toggle ── */}
          <button
            className="md:hidden z-50 w-9 h-9 flex items-center justify-center rounded-md border border-gray-800 hover:border-gold-500/30 bg-vault-800/60 text-gray-400 hover:text-gold-400 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileMenuOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-vault-900 border-l border-gray-800/80 md:hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/60">
                <div className="flex flex-col leading-none">
                  <span className="font-display text-sm font-bold tracking-[0.15em] uppercase text-gold-gradient">
                    TCG Tracker
                  </span>
                  <span className="text-[8px] tracking-[0.3em] uppercase text-gray-600 mt-0.5">
                    Collector&apos;s Vault
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-800 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-4 py-5 overflow-y-auto">
                {isLoadingAuth ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-12 bg-vault-700/30 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : user ? (
                  <div className="space-y-1">
                    {NAV_LINKS.map((link, i) => {
                      const isActive = pathname === link.path;
                      return (
                        <motion.div
                          key={link.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <Link
                            href={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide uppercase transition-all ${
                              isActive
                                ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                                : "text-gray-400 hover:text-white hover:bg-vault-800/60"
                            }`}
                          >
                            <link.icon className={`w-4 h-4 ${isActive ? "text-gold-400" : "text-gray-600"}`} />
                            {link.name}
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500" />}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 mb-4">Get Started</p>
                    <button
                      onClick={() => { setAuthMode("login"); setIsAuthOpen(true); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center py-3 rounded-xl border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 font-medium text-sm tracking-wide transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode("register"); setIsAuthOpen(true); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center py-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 font-medium text-sm tracking-wide hover:bg-gold-500/20 transition-colors"
                    >
                      Open Your Vault
                    </button>
                  </div>
                )}
              </nav>

              {/* Bottom user section */}
              {!isLoadingAuth && user && (
                <div className="px-4 py-5 border-t border-gray-800/60 space-y-2">
                  {/* User card */}
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-vault-800/60 border border-gray-800/60">
                    <div className="w-9 h-9 rounded-full border border-gold-500/30 bg-vault-700 flex items-center justify-center overflow-hidden shrink-0">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gold-400 font-bold text-sm">{userInitial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.user_metadata?.display_name || "Collector"}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-vault-800/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-600" />
                    Profile
                  </Link>

                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/80 hover:text-red-300 hover:bg-red-900/15 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
