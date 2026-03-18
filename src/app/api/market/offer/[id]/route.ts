import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: offerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (!action || !["accept", "reject", "withdraw"].includes(action)) {
    return NextResponse.json(
      { error: "action must be accept | reject | withdraw" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    // Atomic RPC: accept offer + mark listing sold + reject other offers + create transaction
    const { data: transactionId, error } = await supabase.rpc("accept_offer", {
      p_offer_id: offerId,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("offer_not_found"))    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
      if (msg.includes("not_seller"))          return NextResponse.json({ error: "Only the seller can accept." }, { status: 403 });
      if (msg.includes("offer_not_pending"))   return NextResponse.json({ error: "Offer is no longer pending." }, { status: 409 });
      if (msg.includes("offer_expired"))       return NextResponse.json({ error: "Offer has expired." }, { status: 410 });
      if (msg.includes("listing_not_available")) return NextResponse.json({ error: "Listing no longer available." }, { status: 409 });
      console.error("[accept_offer] RPC error:", error);
      return NextResponse.json({ error: "Failed to accept offer." }, { status: 500 });
    }

    return NextResponse.json({ transactionId }, { status: 200 });
  }

  if (action === "reject") {
    // Verify caller is the seller
    const { data: offer } = await supabase
      .from("market_offers")
      .select("seller_id, status")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    if (offer.seller_id !== user.id)
      return NextResponse.json({ error: "Only the seller can reject." }, { status: 403 });
    if (offer.status !== "pending")
      return NextResponse.json({ error: "Offer is not pending." }, { status: 409 });

    const { error } = await supabase
      .from("market_offers")
      .update({ status: "rejected" })
      .eq("id", offerId);

    if (error) return NextResponse.json({ error: "Failed to reject offer." }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  if (action === "withdraw") {
    // Verify caller is the buyer
    const { data: offer } = await supabase
      .from("market_offers")
      .select("buyer_id, status")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    if (offer.buyer_id !== user.id)
      return NextResponse.json({ error: "Only the buyer can withdraw." }, { status: 403 });
    if (offer.status !== "pending")
      return NextResponse.json({ error: "Offer is not pending." }, { status: 409 });

    const { error } = await supabase
      .from("market_offers")
      .update({ status: "withdrawn" })
      .eq("id", offerId);

    if (error) return NextResponse.json({ error: "Failed to withdraw offer." }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
