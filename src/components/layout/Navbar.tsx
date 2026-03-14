"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Grip, LogOut, User } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { name: "Collection", path: "/collection" },
  { name: "Decks", path: "/decks" },
  { name: "Market", path: "/market" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-vault-900/80 backdrop-blur-md border-b vault-border py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 z-50">
            <div className="w-10 h-10 rounded-sm vault-border flex items-center justify-center bg-vault-800 vault-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              <Grip className="w-6 h-6 text-gold-400 group-hover:text-gold-300 transition-colors" />
            </div>
            <span className="text-xl font-bold tracking-widest uppercase text-gold-gradient hidden sm:block">
              TCG Tracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user && (
              <Link
                href="/dashboard"
                className={`relative py-2 text-sm font-medium tracking-wider uppercase transition-colors ${
                  pathname === "/dashboard" ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Dashboard
                {pathname === "/dashboard" && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient"
                  />
                )}
              </Link>
            )}
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative py-2 text-sm font-medium tracking-wider uppercase transition-colors ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth / Action */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-vault-800 border vault-border flex items-center justify-center overflow-hidden vault-glow shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gold-400" />
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-sm font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-medium tracking-wider uppercase transition-all vault-glow hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] relative overflow-hidden group"
                >
                  <span className="relative z-10">Vault Access</span>
                  <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 text-gold-400 hover:text-gold-300 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-[73px] bg-vault-900 border-t vault-border md:hidden z-40 p-6 flex flex-col gap-8 h-[calc(100vh-73px)] overflow-y-auto"
            >
              <nav className="flex flex-col gap-6">
                {user && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8">
                <div className="h-px w-full vault-border border-b opacity-50 mb-8" />
                {user ? (
                  <div className="flex flex-col gap-6 items-center">
                    <div className="flex items-center gap-4 bg-vault-800 w-full p-4 rounded-sm vault-border">
                      <div className="w-12 h-12 rounded-sm border border-gold-500/30 flex items-center justify-center overflow-hidden">
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-gold-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm truncate w-40">{user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-center py-3 text-lg font-medium tracking-wider uppercase text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => {
                        setIsAuthOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="text-center py-3 text-lg font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsAuthOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="text-center py-3 rounded-sm vault-border bg-vault-800 text-gold-400 text-lg font-medium tracking-wider uppercase"
                    >
                      Vault Access
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
