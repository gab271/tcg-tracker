import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { listingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { listingId } = body;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // Get buyer's username for the transaction record
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  const buyerUsername = profile?.username ?? user.email?.split("@")[0] ?? null;

  // Call the SECURITY DEFINER RPC — atomically marks listing sold + creates transaction
  const { data: transactionId, error } = await supabase.rpc("buy_listing", {
    p_listing_id: listingId,
    p_buyer_username: buyerUsername,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("listing_not_available")) {
      return NextResponse.json({ error: "This listing is no longer available." }, { status: 409 });
    }
    if (msg.includes("cannot_buy_own_listing")) {
      return NextResponse.json({ error: "You cannot buy your own listing." }, { status: 403 });
    }
    if (msg.includes("not_authenticated")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[buy] RPC error:", error);
    return NextResponse.json({ error: "Purchase failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ transactionId }, { status: 201 });
}
