import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

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
