/**
 * POST /api/cron/snapshot-portfolio
 *
 * Cron job diario que calcula el valor total del portfolio de cada usuario
 * y guarda un snapshot en portfolio_snapshots.
 *
 * Configurar en vercel.json:
 *   { "crons": [{ "path": "/api/cron/snapshot-portfolio", "schedule": "0 2 * * *" }] }
 *
 * Protegido con CRON_SECRET en el header Authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { serverEnv, env } from "@/lib/config";

function getAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(request: NextRequest) {
  // Verificar CRON_SECRET
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Obtener todos los usuarios con su valor total de colección
  const { data: rows, error } = await supabase
    .from("collections")
    .select("user_id, price, quantity");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agrupar por user_id
  const byUser: Record<string, { totalValue: number; totalCards: number }> = {};
  for (const row of rows ?? []) {
    if (!byUser[row.user_id]) byUser[row.user_id] = { totalValue: 0, totalCards: 0 };
    byUser[row.user_id].totalValue += (row.price ?? 0) * (row.quantity ?? 1);
    byUser[row.user_id].totalCards += row.quantity ?? 1;
  }

  // Insertar snapshots (upsert por user_id + snapshot_date)
  const snapshots = Object.entries(byUser).map(([user_id, stats]) => ({
    user_id,
    snapshot_date: today,
    total_value: Math.round(stats.totalValue * 100) / 100,
    total_cards: stats.totalCards,
  }));

  if (snapshots.length > 0) {
    const { error: upsertError } = await supabase
      .from("portfolio_snapshots")
      .upsert(snapshots, { onConflict: "user_id,snapshot_date" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, snapshots: snapshots.length, date: today });
}
