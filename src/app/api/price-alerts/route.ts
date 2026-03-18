import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchUserAlerts,
  createAlert,
  deleteAlert,
  toggleAlert,
} from "@/lib/supabase/queries/price-alerts";

async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const alerts = await fetchUserAlerts(supabase, user.id);
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[price-alerts GET]", err);
    return NextResponse.json({ error: "Failed to fetch alerts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    cardId?: string;
    cardName?: string;
    cardImage?: string;
    game?: string;
    targetPrice?: number;
    direction?: "below" | "above";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cardId, cardName, game, targetPrice } = body;
  if (!cardId || !cardName || !game || !targetPrice || targetPrice <= 0) {
    return NextResponse.json(
      { error: "cardId, cardName, game and targetPrice (> 0) are required." },
      { status: 400 }
    );
  }

  try {
    const alert = await createAlert(supabase, user.id, {
      cardId,
      cardName,
      cardImage: body.cardImage,
      game,
      targetPrice,
      direction: body.direction ?? "below",
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    console.error("[price-alerts POST]", err);
    return NextResponse.json({ error: "Failed to create alert." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const alertId = searchParams.get("id");
  if (!alertId) return NextResponse.json({ error: "id is required." }, { status: 400 });

  try {
    await deleteAlert(supabase, alertId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[price-alerts DELETE]", err);
    return NextResponse.json({ error: "Failed to delete alert." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { alertId?: string; isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { alertId, isActive } = body;
  if (!alertId || isActive === undefined) {
    return NextResponse.json({ error: "alertId and isActive are required." }, { status: 400 });
  }

  try {
    await toggleAlert(supabase, alertId, isActive, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[price-alerts PATCH]", err);
    return NextResponse.json({ error: "Failed to update alert." }, { status: 500 });
  }
}
