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

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get("host")}`;

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
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
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
            html: buildAlertEmail({
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

function buildAlertEmail(params: {
  cardName: string;
  cardImage: string | null;
  game: string;
  targetPrice: number;
  currentPrice: number;
  direction: string;
  siteUrl: string;
}): string {
  const { cardName, cardImage, game, targetPrice, currentPrice, direction, siteUrl } = params;
  const dirLabel = direction === "below" ? "dropped below" : "rose above";
  const delta = Math.abs(currentPrice - targetPrice).toFixed(2);

  return `
<!DOCTYPE html>
<html>
<body style="background:#0f1115;color:#f3f4f6;font-family:system-ui,sans-serif;margin:0;padding:32px">
  <div style="max-width:520px;margin:0 auto">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">🔔</span>
      <h1 style="color:#d4af37;font-size:22px;margin:8px 0">Price Alert Triggered</h1>
    </div>
    ${cardImage ? `<div style="text-align:center;margin-bottom:20px"><img src="${cardImage}" alt="${cardName}" style="height:140px;border-radius:8px"/></div>` : ""}
    <div style="background:#16191f;border:1px solid #2a2d35;border-radius:12px;padding:24px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em">${game}</p>
      <h2 style="margin:0 0 16px;font-size:20px;color:#fff">${cardName}</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Current Price</td>
          <td style="padding:8px 0;text-align:right;color:#d4af37;font-weight:700;font-family:monospace">€${currentPrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Your Target</td>
          <td style="padding:8px 0;text-align:right;color:#f3f4f6;font-family:monospace">€${targetPrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Difference</td>
          <td style="padding:8px 0;text-align:right;color:${direction === "below" ? "#4ade80" : "#f87171"};font-family:monospace">€${delta}</td>
        </tr>
      </table>
    </div>
    <p style="color:#9ca3af;font-size:14px;text-align:center">
      The price of <strong style="color:#fff">${cardName}</strong> has ${dirLabel} your target of <strong style="color:#d4af37">€${targetPrice.toFixed(2)}</strong>.
    </p>
    <div style="text-align:center;margin-top:24px">
      <a href="${siteUrl}/market" style="display:inline-block;background:#d4af37;color:#0f1115;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px">Browse Market →</a>
    </div>
    <p style="color:#374151;font-size:12px;text-align:center;margin-top:32px">
      TCG Tracker · <a href="${siteUrl}/settings" style="color:#6b7280">Manage alerts</a>
    </p>
  </div>
</body>
</html>`;
}
