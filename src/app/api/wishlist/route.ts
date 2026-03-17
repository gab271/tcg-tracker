import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/supabase/queries/wishlist";

async function getSupabaseUser() {
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
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await fetchWishlist(supabase, user.id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[wishlist GET]", err);
    return NextResponse.json({ error: "Failed to fetch wishlist." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { cardId?: string; cardName?: string; cardImage?: string; game?: string; maxPrice?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cardId, cardName, game } = body;
  if (!cardId || !cardName || !game) {
    return NextResponse.json({ error: "cardId, cardName and game are required." }, { status: 400 });
  }

  try {
    const item = await addToWishlist(supabase, user.id, {
      cardId,
      cardName,
      cardImage: body.cardImage,
      game,
      maxPrice: body.maxPrice,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[wishlist POST]", err);
    return NextResponse.json({ error: "Failed to add to wishlist." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getSupabaseUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("id");
  if (!itemId) return NextResponse.json({ error: "id is required." }, { status: 400 });

  try {
    await removeFromWishlist(supabase, itemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wishlist DELETE]", err);
    return NextResponse.json({ error: "Failed to remove item." }, { status: 500 });
  }
}
