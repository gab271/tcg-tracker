/**
 * POST /api/cron/check-alerts
 *
 * Called by Vercel Cron (vercel.json) or Supabase Edge Function scheduler.
 * Iterates all active price alerts, fetches current market price, fires email
 * via Resend when the threshold is crossed.
 *
 * Protect with CRON_SECRET env var (Vercel injects this automatically).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { serverEnv, env } from "@/lib/config";
import { buildPriceAlertEmail } from "@/lib/email";

const CRON_SECRET = serverEnv.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Validate cron secret — fail-closed: reject if secret is missing or wrong
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const supabase = createSupabaseAdmin(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);

  // Fetch all active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("is_active", true);

  if (alertsError) {
    console.error("[check-alerts] fetch alerts error:", alertsError);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ checked: 0, triggered: 0 });
  }

  let triggered = 0;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get("host") ?? "localhost:3000"}`;

  for (const alert of alerts) {
    try {
      // Fetch current price from our own card-price API
      const priceRes = await fetch(
        `${baseUrl}/api/card-price?cardId=${encodeURIComponent(alert.card_id)}&game=${encodeURIComponent(alert.game)}`
      );
      if (!priceRes.ok) continue;

      const priceData = await priceRes.json();
      const currentPrice: number | null = priceData.currentPrice ?? null;

      if (currentPrice === null) continue;

      // Update last_price
      await supabase
        .from("price_alerts")
        .update({ last_price: currentPrice })
        .eq("id", alert.id);

      // Check if threshold is crossed
      const shouldFire =
        alert.direction === "below"
          ? currentPrice <= alert.target_price
          : currentPrice >= alert.target_price;

      if (!shouldFire) continue;

      // Avoid re-triggering within 24 hours
      if (alert.last_triggered_at) {
        const lastFired = new Date(alert.last_triggered_at).getTime();
        if (Date.now() - lastFired < 24 * 60 * 60 * 1000) continue;
      }

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      // Send email via Resend
      const RESEND_API_KEY = serverEnv.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        const directionLabel = alert.direction === "below" ? "dropped below" : "rose above";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TCG Tracker <alerts@tcgtracker.app>",
            to: email,
            subject: `🔔 Price Alert: ${alert.card_name} ${directionLabel} €${alert.target_price}`,
            html: buildPriceAlertEmail({
              cardName: alert.card_name,
              cardImage: alert.card_image,
              game: alert.game,
              targetPrice: alert.target_price,
              currentPrice,
              direction: alert.direction,
              siteUrl: baseUrl,
            }),
          }),
        });
      }

      // Mark alert as triggered
      await supabase
        .from("price_alerts")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", alert.id);

      triggered++;
    } catch (err) {
      console.error(`[check-alerts] error processing alert ${alert.id}:`, err);
    }
  }

  return NextResponse.json({ checked: alerts.length, triggered });
}

