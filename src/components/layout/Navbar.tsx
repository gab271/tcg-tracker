"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Grip } from "lucide-react";

const NAV_LINKS = [
  { name: "Collection", path: "/collection" },
  { name: "Decks", path: "/decks" },
  { name: "Market", path: "/market" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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
          <span className="text-xl font-bold tracking-widest uppercase text-gold-gradient">
            TCG Tracker
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className="relative py-2 text-sm font-medium tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
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
          <Link
            href="/login"
            className="text-sm font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-sm vault-border bg-vault-800 hover:bg-vault-700 text-gold-400 text-sm font-medium tracking-wider uppercase transition-all vault-glow hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] relative overflow-hidden group"
          >
            <span className="relative z-10">Vault Access</span>
            <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </Link>
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
            className="fixed inset-0 top-[73px] bg-vault-900 border-t vault-border md:hidden z-40 p-6 flex flex-col gap-8"
          >
            <nav className="flex flex-col gap-6">
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
            <div className="h-px w-full vault-border border-b opacity-50" />
            <div className="flex flex-col gap-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 text-lg font-medium tracking-wider uppercase text-gray-300 hover:text-gold-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 rounded-sm vault-border bg-vault-800 text-gold-400 text-lg font-medium tracking-wider uppercase"
              >
                Vault Access
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
