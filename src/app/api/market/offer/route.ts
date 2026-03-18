import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOffer } from "@/lib/supabase/queries/offers";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    listingId?: string;
    offeredPrice?: number;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { listingId, offeredPrice, message } = body;

  if (!listingId || !offeredPrice || offeredPrice <= 0) {
    return NextResponse.json(
      { error: "listingId and offeredPrice (> 0) are required." },
      { status: 400 }
    );
  }

  // Verify listing is still active and fetch the real seller_id from the server
  // (never trust the client for sellerId — it can be forged to bypass self-offer checks)
  const { data: listing } = await supabase
    .from("market_listings")
    .select("id, status, seller_id")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (!listing) {
    return NextResponse.json(
      { error: "This listing is no longer available." },
      { status: 409 }
    );
  }

  const sellerId = listing.seller_id;

  if (sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot make an offer on your own listing." },
      { status: 403 }
    );
  }

  // Get buyer username
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  const buyerUsername = profile?.username ?? user.email?.split("@")[0] ?? null;

  try {
    const offer = await createOffer(supabase, user.id, {
      listingId,
      sellerId,
      buyerUsername,
      offeredPrice,
      message,
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (err) {
    console.error("[offer] error:", err);
    return NextResponse.json({ error: "Failed to submit offer." }, { status: 500 });
  }
}
