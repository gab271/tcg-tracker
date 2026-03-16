import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { fetchListingById } from "@/lib/supabase/queries/market";
import ListingDetailClient from "@/components/market/ListingDetailClient";

interface ListingPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { listingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/api/auth");

  const listing = await fetchListingById(supabase, listingId).catch(() => null);
  if (!listing) notFound();

  return <ListingDetailClient listing={listing} />;
}
