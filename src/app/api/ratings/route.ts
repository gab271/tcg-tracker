/**
 * POST /api/ratings
 *
 * Crea una valoración del vendedor después de una transacción completada.
 *
 * Body: { transaction_id, seller_id, rating (1-5), comment? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config";
import { z } from "zod";

const schema = z.object({
  transaction_id: z.string().uuid(),
  seller_id:      z.string().uuid(),
  rating:         z.number().int().min(1).max(5),
  comment:        z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { transaction_id, seller_id, rating, comment } = parsed.data;

  // Verificar que la transacción existe y el usuario es el comprador
  const { data: tx } = await supabase
    .from("market_transactions")
    .select("id, buyer_id, status")
    .eq("id", transaction_id)
    .single();

  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (tx.buyer_id !== user.id) return NextResponse.json({ error: "Only buyers can rate sellers" }, { status: 403 });
  if (tx.status !== "completed") return NextResponse.json({ error: "Transaction not completed yet" }, { status: 400 });

  const { error } = await supabase.from("seller_ratings").insert({
    transaction_id,
    reviewer_id: user.id,
    seller_id,
    rating,
    comment: comment ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already rated this transaction" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * GET /api/ratings?seller_id=...
 *
 * Devuelve el avg_rating y total_ratings de un vendedor.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const sellerId = new URL(request.url).searchParams.get("seller_id");
  if (!sellerId) return NextResponse.json({ error: "Missing seller_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("seller_rating_stats")
    .select("*")
    .eq("seller_id", sellerId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    avg_rating:    data?.avg_rating ?? null,
    total_ratings: data?.total_ratings ?? 0,
  });
}
