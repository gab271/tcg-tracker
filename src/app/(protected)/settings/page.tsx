"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  CreditCard,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Download,
  Trash2,
  Star,
  Zap,
  BarChart2,
  Shield,
  ChevronRight,
  Lock,
  Mail,
  Globe,
  DollarSign,
  Upload,
  ExternalLink,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useImportCollection } from "@/hooks/use-collection";
import {
  upsertUserProfile,
  fetchOwnProfile,
} from "@/lib/supabase/queries/public-profile";
import type { AddCardInput } from "@/lib/validations/collection";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "account" | "notifications" | "billing" | "danger";

interface NotifPrefs {
  priceAlerts: boolean;
  weeklySummary: boolean;
  newListings: boolean;
}

interface AppPrefs {
  currency: "EUR" | "USD" | "GBP";
  language: "en" | "es";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType; danger?: boolean }[] = [
  { id: "account",       label: "Account",       icon: User        },
  { id: "notifications", label: "Notifications", icon: Bell        },
  { id: "billing",       label: "Billing",       icon: CreditCard  },
  { id: "danger",        label: "Danger Zone",   icon: AlertTriangle, danger: true },
];

const PRO_FEATURES = [
  { icon: BarChart2, label: "Advanced price analytics & charts"    },
  { icon: Bell,      label: "Real-time price drop notifications"   },
  { icon: Zap,       label: "Unlimited deck & collection imports"  },
  { icon: Shield,    label: "Priority support & early access"      },
];

const CURRENCIES: AppPrefs["currency"][] = ["EUR", "USD", "GBP"];
const CURRENCY_SYMBOLS: Record<AppPrefs["currency"], string> = { EUR: "€", USD: "$", GBP: "£" };

// ─── Reusable primitives ──────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gold-500/12 bg-vault-700 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-6 py-4 border-b border-gold-500/10">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  suffix,
  readOnly,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  suffix?: React.ReactNode;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          className={`w-full bg-vault-900 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-colors
            ${readOnly
              ? "border-white/5 text-gray-500 cursor-default"
              : "border-gold-500/15 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20"
            }
            ${suffix ? "pr-10" : ""}
          `}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {hint && <p className="text-[10px] text-gray-700 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? "#d4af37" : "rgba(255,255,255,0.08)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SaveButton({
  loading,
  disabled,
  label = "Save changes",
}: {
  loading: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading || disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 px-5 py-2 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_16px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      {loading ? "Saving…" : label}
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<TabId>("account");

  // ── Billing: Stripe upgrade
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("No se pudo iniciar el pago. Inténtalo de nuevo.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // Redirigir al portal de cliente de Stripe
    router.push("/pricing");
  };

  // ── Account: password
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCurrPw, setShowCurrPw] = useState(false);
  const [showNewPw,  setShowNewPw]  = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);
  const [pwSaving,   setPwSaving]   = useState(false);

  // ── Account: email
  const [newEmail,    setNewEmail]    = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  // ── Account: preferences
  const [prefs,      setPrefs]      = useState<AppPrefs>({ currency: "EUR", language: "en" });
  const [prefSaving, setPrefSaving] = useState(false);

  // ── Notifications
  const [notifs,      setNotifs]      = useState<NotifPrefs>({ priceAlerts: true, weeklySummary: true, newListings: false });
  const [notifSaving, setNotifSaving] = useState(false);

  // ── Danger zone
  const [exporting,       setExporting]       = useState(false);
  const [exportingJson,   setExportingJson]   = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState("");
  const [deleting,        setDeleting]        = useState(false);

  // ── Public profile
  const [pubUsername,          setPubUsername]          = useState("");
  const [pubCollection,        setPubCollection]        = useState(false);
  const [pubDecks,             setPubDecks]             = useState(false);
  const [pubProfileSaving,     setPubProfileSaving]     = useState(false);
  const [pubProfileLoaded,     setPubProfileLoaded]     = useState(false);

  // ── Import
  const [importedCards, setImportedCards]     = useState<AddCardInput[] | null>(null);
  const [importError,   setImportError]       = useState<string | null>(null);
  const importCollection = useImportCollection();

  // ── Load user metadata into state
  useEffect(() => {
    const meta = user?.user_metadata ?? {};
    if (meta.preferences) {
      setPrefs((p) => ({ ...p, ...(meta.preferences as Partial<AppPrefs>) }));
    }
    if (meta.notifications) {
      setNotifs((n) => ({ ...n, ...(meta.notifications as Partial<NotifPrefs>) }));
    }
  }, [user]);

  // ── Load public profile
  useEffect(() => {
    if (!user || pubProfileLoaded) return;
    fetchOwnProfile(supabase, user.id).then((p) => {
      if (p) {
        setPubUsername(p.username ?? "");
        setPubCollection(p.isPublicCollection);
        setPubDecks(p.isPublicDecks);
      }
      setPubProfileLoaded(true);
    });
  }, [user, supabase, pubProfileLoaded]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }
    if (newPw.length < 8)    { toast.error("Password must be at least 8 characters."); return; }

    setPwSaving(true);
    try {
      // Verify current password first
      if (!user?.email) throw new Error("No email on account");
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (verifyError) { toast.error("Current password is incorrect."); return; }

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;

      toast.success("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) { toast.error("Please enter a valid email."); return; }

    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation sent to both addresses. Check your inbox.");
      setNewEmail("");
    } catch {
      toast.error("Failed to update email. Please try again.");
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePrefsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { preferences: prefs } });
      if (error) throw error;
      toast.success("Preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setPrefSaving(false);
    }
  };

  const handleNotifToggle = useCallback(
    async (key: keyof NotifPrefs) => {
      const updated = { ...notifs, [key]: !notifs[key] };
      setNotifs(updated);
      setNotifSaving(true);
      try {
        const { error } = await supabase.auth.updateUser({ data: { notifications: updated } });
        if (error) throw error;
        toast.success("Notification preference saved.");
      } catch {
        setNotifs(notifs); // revert
        toast.error("Failed to save notification preference.");
      } finally {
        setNotifSaving(false);
      }
    },
    [notifs, supabase.auth]
  );

  const handlePublicProfileSave = async () => {
    if (!user) return;
    if (pubUsername && !/^[a-z0-9_]{3,30}$/.test(pubUsername)) {
      toast.error("Username must be 3–30 chars: lowercase letters, numbers, underscores.");
      return;
    }
    setPubProfileSaving(true);
    try {
      await upsertUserProfile(supabase, user.id, {
        username: pubUsername || undefined,
        displayName: profile?.displayName,
        avatarUrl: profile?.avatarUrl ?? undefined,
        isPublicCollection: pubCollection,
        isPublicDecks: pubDecks,
      });
      toast.success("Public profile updated.");
    } catch {
      toast.error("Failed to save public profile.");
    } finally {
      setPubProfileSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [{ data: collection }, { data: decks }] = await Promise.all([
        supabase.from("collections").select("*").eq("user_id", user.id),
        supabase.from("decks").select("*").eq("user_id", user.id),
      ]);

      const collectionCsv = [
        ["Card ID", "Card Name", "Game", "Rarity", "Price (€)", "Quantity", "Date Added"],
        ...(collection ?? []).map((c: Record<string, unknown>) => [
          c.card_id,
          `"${c.card_name}"`,
          c.game,
          (c.rarity as string) ?? "",
          c.price,
          c.quantity,
          new Date(c.created_at as string).toLocaleDateString("en-GB"),
        ]),
      ]
        .map((r) => r.join(","))
        .join("\n");

      const decksCsv = [
        ["Deck Name", "Game", "Format", "Created"],
        ...(decks ?? []).map((d: Record<string, unknown>) => [
          `"${d.name}"`,
          d.game,
          (d.format as string) ?? "",
          new Date(d.created_at as string).toLocaleDateString("en-GB"),
        ]),
      ]
        .map((r) => r.join(","))
        .join("\n");

      const fullCsv = `COLLECTION\n${collectionCsv}\n\nDECKS\n${decksCsv}`;
      const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `vault-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully.");
    } catch {
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!user) return;
    setExportingJson(true);
    try {
      const [{ data: collection }, { data: decks }] = await Promise.all([
        supabase.from("collections").select("*").eq("user_id", user.id),
        supabase.from("decks").select("*, deck_cards(*)").eq("user_id", user.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        collection: (collection ?? []).map((c: Record<string, unknown>) => ({
          card_id: c.card_id,
          card_name: c.card_name,
          game: c.game,
          rarity: c.rarity,
          price: c.price,
          quantity: c.quantity,
          card_image: c.card_image,
        })),
        decks: (decks ?? []).map((d: Record<string, unknown>) => ({
          name: d.name,
          game: d.game,
          cards: d.deck_cards,
        })),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `vault-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON exported successfully.");
    } catch {
      toast.error("Failed to export JSON.");
    } finally {
      setExportingJson(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportedCards(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          const json = JSON.parse(text);
          const cards: AddCardInput[] = (json.collection ?? []).map((c: Record<string, unknown>) => ({
            cardId: String(c.card_id ?? ""),
            name: String(c.card_name ?? ""),
            image: (c.card_image as string | undefined) ?? undefined,
            game: String(c.game ?? ""),
            rarity: String(c.rarity ?? "Common"),
            price: Number(c.price ?? 0),
            quantity: Number(c.quantity ?? 1),
          })).filter((c: AddCardInput) => c.cardId && c.name);
          setImportedCards(cards);
        } else {
          // CSV: skip non-data lines, find the COLLECTION section
          const lines = text.split("\n");
          const start = lines.findIndex((l) => l.trim().startsWith("Card ID,"));
          if (start === -1) { setImportError("Invalid CSV format. Export a file first to see the expected format."); return; }
          const cards: AddCardInput[] = [];
          for (let i = start + 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row || row.startsWith("DECKS")) break;
            const cols = row.split(",");
            if (cols.length < 5) continue;
            const cardId = cols[0]?.trim();
            const name = cols[1]?.replace(/^"|"$/g, "").trim();
            if (!cardId || !name) continue;
            cards.push({
              cardId,
              name,
              game: cols[2]?.trim() ?? "",
              rarity: cols[3]?.trim() ?? "Common",
              price: parseFloat(cols[4] ?? "0") || 0,
              quantity: parseInt(cols[5] ?? "1", 10) || 1,
            });
          }
          setImportedCards(cards);
        }
      } catch {
        setImportError("Failed to parse file. Make sure it's a valid TCG Vault export.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleImportSubmit = async () => {
    if (!importedCards || importedCards.length === 0) return;
    try {
      const result = await importCollection.mutateAsync(importedCards);
      toast.success(`Imported ${result.imported} cards to your vault.`);
      setImportedCards(null);
    } catch {
      toast.error("Import failed. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await signOut();
      router.push("/");
      toast.success("Account deleted.");
    } catch {
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    );
  }

  const plan = profile?.plan ?? "FREE";

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-vault-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gold-500/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto py-10 px-5 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-[9px] font-bold text-gold-400/60 uppercase tracking-[0.25em] mb-1.5">
            Vault · Configuration
          </p>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">Settings</h1>
        </motion.div>

        {/* ── Tab bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="flex gap-1 overflow-x-auto pb-1 mb-8"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive
                    ? tab.danger ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.1)"
                    : "transparent",
                  border: isActive
                    ? tab.danger ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(212,175,55,0.25)"
                    : "1px solid transparent",
                  color: isActive
                    ? tab.danger ? "#f87171" : "#d4af37"
                    : "#6b7280",
                }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >

            {/* ══════════════ ACCOUNT TAB ══════════════ */}
            {activeTab === "account" && (
              <div className="space-y-5">

                {/* Change Password */}
                <SectionCard>
                  <SectionHeader
                    title="Change Password"
                    description="Use a strong password you don't use elsewhere."
                  />
                  <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                    <InputField
                      label="Current password"
                      type={showCurrPw ? "text" : "password"}
                      value={currentPw}
                      onChange={setCurrentPw}
                      autoComplete="current-password"
                      suffix={
                        <button type="button" onClick={() => setShowCurrPw((s) => !s)}>
                          {showCurrPw
                            ? <EyeOff className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
                            : <Eye    className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />}
                        </button>
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="New password"
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={setNewPw}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        suffix={
                          <button type="button" onClick={() => setShowNewPw((s) => !s)}>
                            {showNewPw
                              ? <EyeOff className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
                              : <Eye    className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />}
                          </button>
                        }
                      />
                      <InputField
                        label="Confirm password"
                        type={showConfPw ? "text" : "password"}
                        value={confirmPw}
                        onChange={setConfirmPw}
                        autoComplete="new-password"
                        suffix={
                          <button type="button" onClick={() => setShowConfPw((s) => !s)}>
                            {showConfPw
                              ? <EyeOff className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
                              : <Eye    className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />}
                          </button>
                        }
                      />
                    </div>

                    {/* Password strength indicator */}
                    {newPw.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => {
                            const score =
                              (newPw.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(newPw) ? 1 : 0) +
                              (/[0-9]/.test(newPw) ? 1 : 0) +
                              (/[^A-Za-z0-9]/.test(newPw) ? 1 : 0);
                            const colors = ["#f87171", "#facc15", "#4ade80", "#22d3ee"];
                            return (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{ background: i <= score ? colors[score - 1] : "rgba(255,255,255,0.06)" }}
                              />
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-gray-700">
                          {newPw.length < 8
                            ? "Too short"
                            : (/[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^A-Za-z0-9]/.test(newPw))
                              ? "Strong password"
                              : "Add uppercase, numbers, or symbols"}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <SaveButton
                        loading={pwSaving}
                        disabled={!currentPw || !newPw || !confirmPw}
                        label="Update password"
                      />
                    </div>
                  </form>
                </SectionCard>

                {/* Change Email */}
                <SectionCard>
                  <SectionHeader
                    title="Email Address"
                    description="A confirmation will be sent to both your current and new email."
                  />
                  <form onSubmit={handleEmailChange} className="p-6 space-y-4">
                    <InputField
                      label="Current email"
                      value={profile?.email ?? ""}
                      readOnly
                      suffix={<Lock className="w-3.5 h-3.5 text-gray-700" />}
                    />
                    <InputField
                      label="New email address"
                      type="email"
                      value={newEmail}
                      onChange={setNewEmail}
                      placeholder="your@newemail.com"
                      autoComplete="email"
                      suffix={<Mail className="w-3.5 h-3.5 text-gray-600" />}
                    />
                    <div className="flex justify-end pt-1">
                      <SaveButton loading={emailSaving} disabled={!newEmail} label="Update email" />
                    </div>
                  </form>
                </SectionCard>

                {/* Preferences */}
                <SectionCard>
                  <SectionHeader
                    title="Preferences"
                    description="Localization settings applied throughout the app."
                  />
                  <form onSubmit={handlePrefsSave} className="p-6 space-y-5">
                    {/* Currency */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
                        <DollarSign className="w-3 h-3" />
                        Preferred Currency
                      </label>
                      <div className="flex gap-2">
                        {CURRENCIES.map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => setPrefs((p) => ({ ...p, currency: cur }))}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
                            style={{
                              background: prefs.currency === cur ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                              borderColor: prefs.currency === cur ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
                              color: prefs.currency === cur ? "#d4af37" : "#6b7280",
                            }}
                          >
                            <span>{CURRENCY_SYMBOLS[cur]}</span>
                            {cur}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
                        <Globe className="w-3 h-3" />
                        Language
                      </label>
                      <div className="flex gap-2">
                        {(["en", "es"] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setPrefs((p) => ({ ...p, language: lang }))}
                            className="px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
                            style={{
                              background: prefs.language === lang ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                              borderColor: prefs.language === lang ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
                              color: prefs.language === lang ? "#d4af37" : "#6b7280",
                            }}
                          >
                            {lang === "en" ? "🇬🇧 English" : "🇪🇸 Español"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <SaveButton loading={prefSaving} label="Save preferences" />
                    </div>
                  </form>
                </SectionCard>

                {/* Public Profile */}
                <SectionCard>
                  <SectionHeader
                    title="Public Profile"
                    description="Share your collection and decks with a public link."
                  />
                  <div className="p-6 space-y-5">
                    {/* Username */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5">
                        <Link2 className="w-3 h-3" />
                        Public username
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-mono shrink-0">tcgvault.app/u/</span>
                        <input
                          value={pubUsername}
                          onChange={(e) => setPubUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="your_username"
                          maxLength={30}
                          className="flex-1 bg-vault-800 border border-gray-700 focus:border-gold-500/50 rounded-lg h-10 px-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors font-mono"
                        />
                      </div>
                      {pubUsername.length > 0 && pubUsername.length < 3 && (
                        <p className="text-[10px] text-red-400 mt-1">Minimum 3 characters</p>
                      )}
                    </div>

                    {/* Toggles */}
                    {[
                      { label: "Make collection public", desc: "Anyone can view your full card vault.", value: pubCollection, onChange: setPubCollection },
                      { label: "Make decks public", desc: "Anyone can view your deck lists.", value: pubDecks, onChange: setPubDecks },
                    ].map(({ label, desc, value, onChange }) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{label}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onChange(!value)}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 ${
                            value ? "bg-gold-500 border-gold-400" : "bg-gray-700 border-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                              value ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}

                    {/* Share link preview */}
                    {pubUsername.length >= 3 && (
                      <div className="flex items-center gap-2 p-3 bg-vault-900 rounded-lg border border-gray-800">
                        <ExternalLink className="w-3.5 h-3.5 text-gold-400/60 shrink-0" />
                        <span className="text-xs font-mono text-gray-500 truncate">
                          tcgvault.app/u/{pubUsername}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/u/${pubUsername}`);
                            toast.success("Link copied!");
                          }}
                          className="ml-auto text-[10px] text-gold-400/70 hover:text-gold-400 transition-colors uppercase tracking-wider shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <motion.button
                        type="button"
                        onClick={handlePublicProfileSave}
                        disabled={pubProfileSaving || (pubUsername.length > 0 && pubUsername.length < 3)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-2 bg-gold-500 hover:bg-gold-400 text-vault-900 font-bold text-sm rounded-xl transition-colors shadow-[0_0_16px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pubProfileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {pubProfileSaving ? "Saving…" : "Save profile"}
                      </motion.button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══════════════ NOTIFICATIONS TAB ══════════════ */}
            {activeTab === "notifications" && (
              <SectionCard>
                <SectionHeader
                  title="Email Notifications"
                  description="Control which emails Vault sends to your inbox."
                />
                <div className="divide-y divide-white/5">
                  {[
                    {
                      key: "priceAlerts" as const,
                      icon: BarChart2,
                      title: "Price drop alerts",
                      desc: "Get notified when a card in your collection falls below your target price.",
                    },
                    {
                      key: "weeklySummary" as const,
                      icon: Star,
                      title: "Weekly collection summary",
                      desc: "A Monday email with your collection's total value change for the week.",
                    },
                    {
                      key: "newListings" as const,
                      icon: Bell,
                      title: "New marketplace listings",
                      desc: "Alerts when cards on your wishlist appear on the market.",
                    },
                  ].map(({ key, icon: Icon, title, desc }) => (
                    <div key={key} className="flex items-start justify-between gap-4 px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 max-w-sm leading-relaxed">{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                        {notifSaving && <Loader2 className="w-3 h-3 animate-spin text-gray-600" />}
                        <Toggle
                          checked={notifs[key]}
                          onChange={() => handleNotifToggle(key)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ══════════════ BILLING TAB ══════════════ */}
            {activeTab === "billing" && (
              <div className="space-y-5">

                {/* Current plan */}
                <SectionCard>
                  <SectionHeader title="Current Plan" />
                  <div className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: plan === "PRO" ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                            border: plan === "PRO" ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {plan === "PRO"
                            ? <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
                            : <CreditCard className="w-4.5 h-4.5 text-gray-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">
                              {plan === "PRO" ? "Pro Plan" : "Free Plan"}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                              style={
                                plan === "PRO"
                                  ? { background: "rgba(212,175,55,0.15)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }
                                  : { background: "rgba(255,255,255,0.06)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }
                              }
                            >
                              {plan}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {plan === "PRO" ? "Renews on Aug 1, 2026" : "Limited features"}
                          </p>
                        </div>
                      </div>

                      {plan === "PRO" && (
                        <button
                          onClick={handleManageSubscription}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-300 border border-white/10 bg-white/4 hover:bg-white/8 transition-colors"
                        >
                          Manage subscription
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Upgrade card (FREE only) */}
                {plan === "FREE" && (
                  <div
                    className="relative overflow-hidden rounded-2xl p-6 border"
                    style={{
                      background: "linear-gradient(135deg, #16191f 0%, #0f1115 100%)",
                      borderColor: "rgba(212,175,55,0.2)",
                    }}
                  >
                    {/* Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                        <p className="text-[9px] font-bold text-gold-400/60 uppercase tracking-[0.2em]">
                          Vault Pro
                        </p>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white mb-1">
                        Unlock the full vault
                      </h3>
                      <p className="text-sm text-gray-500 mb-5">
                        Everything in Free, plus powerful tools for serious collectors.
                      </p>

                      <ul className="space-y-2.5 mb-6">
                        {PRO_FEATURES.map(({ icon: Icon, label }) => (
                          <li key={label} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-gold-500/15 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-2.5 h-2.5 text-gold-400" />
                            </div>
                            <span className="text-xs text-gray-400">{label}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center gap-4 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleUpgrade}
                          disabled={upgradeLoading}
                          className="flex items-center gap-2 px-6 py-2.5 font-bold text-sm text-vault-900 rounded-xl transition-all disabled:opacity-60"
                          style={{
                            background: "linear-gradient(135deg, #f6d159, #d4af37)",
                            boxShadow: "0 0 24px rgba(212,175,55,0.3)",
                          }}
                        >
                          {upgradeLoading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Zap className="w-3.5 h-3.5" />}
                          {upgradeLoading ? "Redirecting…" : "Upgrade to Pro"}
                        </motion.button>
                        <p className="text-xs text-gray-600">€4.99 / month · Cancel anytime</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice history */}
                <SectionCard>
                  <SectionHeader title="Invoice History" />
                  <div className="p-6">
                    {plan === "PRO" ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gold-500/8">
                              <th className="text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest pb-3">Date</th>
                              <th className="text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest pb-3">Description</th>
                              <th className="text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest pb-3">Amount</th>
                              <th className="text-right text-[10px] font-bold text-gray-600 uppercase tracking-widest pb-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/4">
                            {[
                              { date: "Jul 1, 2026", desc: "Vault Pro — Monthly",  amount: "€4.99", status: "Paid" },
                              { date: "Jun 1, 2026", desc: "Vault Pro — Monthly",  amount: "€4.99", status: "Paid" },
                              { date: "May 1, 2026", desc: "Vault Pro — Monthly",  amount: "€4.99", status: "Paid" },
                            ].map((inv, i) => (
                              <tr key={i} className="group hover:bg-white/2 transition-colors">
                                <td className="py-3 text-gray-500">{inv.date}</td>
                                <td className="py-3 text-gray-400">{inv.desc}</td>
                                <td className="py-3 text-right font-mono text-white">{inv.amount}</td>
                                <td className="py-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <CreditCard className="w-8 h-8 text-gray-800 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No invoices yet.</p>
                        <p className="text-xs text-gray-700 mt-1">Upgrade to Pro to see billing history.</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══════════════ DANGER ZONE TAB ══════════════ */}
            {activeTab === "danger" && (
              <div className="space-y-4">
                {/* Export data */}
                <SectionCard>
                  <SectionHeader
                    title="Export Your Data"
                    description="Download your full collection and decks as CSV or JSON."
                  />
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      CSV format is compatible with spreadsheet apps. JSON format preserves all data
                      and can be re-imported into TCG Vault. Both include card IDs for round-trip import.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleExportData}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/4 hover:bg-white/8 text-gray-300 hover:text-white transition-all disabled:opacity-50"
                      >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {exporting ? "Exporting…" : "Export CSV"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleExportJson}
                        disabled={exportingJson}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/4 hover:bg-white/8 text-gray-300 hover:text-white transition-all disabled:opacity-50"
                      >
                        {exportingJson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {exportingJson ? "Exporting…" : "Export JSON"}
                      </motion.button>
                    </div>
                  </div>
                </SectionCard>

                {/* Import data */}
                <SectionCard>
                  <SectionHeader
                    title="Import Collection"
                    description="Import cards from a TCG Vault export file (CSV or JSON)."
                  />
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Upload a CSV or JSON file exported from TCG Vault. Existing cards will be updated;
                      new cards will be added. Images are not imported but will load automatically.
                    </p>

                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-gold-500/40 cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-gray-600 group-hover:text-gold-400 transition-colors shrink-0" />
                      <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                        {importedCards
                          ? `${importedCards.length} card${importedCards.length !== 1 ? "s" : ""} ready to import`
                          : "Choose a .csv or .json file"}
                      </span>
                      <input
                        type="file"
                        accept=".csv,.json"
                        className="hidden"
                        onChange={handleImportFile}
                      />
                    </label>

                    {importError && (
                      <p className="text-xs text-red-400">{importError}</p>
                    )}

                    {importedCards && importedCards.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-400">
                          {importedCards.length} cards parsed successfully.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setImportedCards(null)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={handleImportSubmit}
                            disabled={importCollection.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gold-500 hover:bg-gold-400 text-vault-900 transition-all disabled:opacity-50"
                          >
                            {importCollection.isPending
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Upload className="w-3.5 h-3.5" />}
                            {importCollection.isPending ? "Importing…" : `Import ${importedCards.length} cards`}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Delete account */}
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}
                >
                  <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(239,68,68,0.12)" }}>
                    <h3 className="text-sm font-semibold text-red-400">Delete Account</h3>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(239,68,68,0.5)" }}>
                      Permanently remove your account and all associated data.
                    </p>
                  </div>
                  <div className="p-6 flex items-start justify-between gap-4 flex-wrap">
                    <div className="text-xs text-gray-600 max-w-sm leading-relaxed">
                      This action is <strong className="text-red-400/70">irreversible</strong>. Your
                      collection, decks, and market listings will be permanently deleted and cannot be
                      recovered.
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDeleteModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete my account
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "#0f1115", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              {/* Red top accent */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delete your account?</h3>
                    <p className="text-xs text-gray-600 mt-0.5">This cannot be undone.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-red-500/6 border border-red-500/15 space-y-1.5">
                    {[
                      "All collection cards and decks",
                      "All active market listings",
                      "Your account and login credentials",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-red-400/70">
                        <div className="w-1 h-1 rounded-full bg-red-500/50 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                      Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      autoFocus
                      className="w-full bg-vault-900 border border-red-900/30 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-gray-700 focus:outline-none focus:border-red-500/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(""); }}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: deleteConfirm === "DELETE" ? 1.02 : 1 }}
                    whileTap={{ scale: deleteConfirm === "DELETE" ? 0.97 : 1 }}
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: deleteConfirm === "DELETE" ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#f87171",
                    }}
                  >
                    {deleting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                    {deleting ? "Deleting…" : "Delete account"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
