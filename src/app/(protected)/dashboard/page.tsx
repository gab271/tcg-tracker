import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto px-6 lg:px-12 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2 uppercase">Dashboard</h1>
        <p className="text-gray-400">Welcome to your vault, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-vault-800 vault-border rounded-xl">
          <h3 className="text-gold-400 font-bold uppercase tracking-wider text-sm mb-4">Total Value</h3>
          <p className="text-3xl font-bold text-white">$0.00</p>
        </div>
        <div className="p-6 bg-vault-800 vault-border rounded-xl">
          <h3 className="text-gold-400 font-bold uppercase tracking-wider text-sm mb-4">Cards Owned</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
        <div className="p-6 bg-vault-800 vault-border rounded-xl">
          <h3 className="text-gold-400 font-bold uppercase tracking-wider text-sm mb-4">Active Decks</h3>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>
    </div>
  );
}
