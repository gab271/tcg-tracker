import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createOffer } from "@/lib/supabase/queries/transactions";

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

  let body: {
    listingId?: string;
    sellerId?: string;
    offeredPrice?: number;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { listingId, sellerId, offeredPrice, message } = body;

  if (!listingId || !sellerId || !offeredPrice || offeredPrice <= 0) {
    return NextResponse.json(
      { error: "listingId, sellerId and offeredPrice (> 0) are required." },
      { status: 400 }
    );
  }

  if (sellerId === user.id) {
    return NextResponse.json(
      { error: "You cannot make an offer on your own listing." },
      { status: 403 }
    );
  }

  // Verify listing is still active
  const { data: listing } = await supabase
    .from("market_listings")
    .select("id, status")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (!listing) {
    return NextResponse.json(
      { error: "This listing is no longer available." },
      { status: 409 }
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
