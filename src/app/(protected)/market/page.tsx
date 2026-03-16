import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchActiveListings } from "@/lib/supabase/queries/market";
import MarketClient from "@/components/market/MarketClient";

export default async function MarketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/api/auth");

  const listings = await fetchActiveListings(supabase).catch(() => []);

  return <MarketClient initialListings={listings} />;
}
