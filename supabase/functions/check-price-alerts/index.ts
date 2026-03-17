/**
 * Supabase Edge Function: check-price-alerts
 *
 * Schedule this in the Supabase dashboard:
 *   Dashboard → Edge Functions → check-price-alerts → Schedule → every 1 hour
 *   OR use: supabase functions deploy check-price-alerts --no-verify-jwt
 *
 * Required secrets (supabase secrets set KEY=value):
 *   RESEND_API_KEY        — Resend.com API key for email delivery
 *   NEXT_PUBLIC_SITE_URL  — e.g. https://tcgtracker.app
 *
 * The SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically injected
 * by the Supabase runtime.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL            = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY          = Deno.env.get("RESEND_API_KEY");
const SITE_URL                = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://tcgtracker.app";
const RESEND_FROM             = "TCG Tracker <alerts@tcgtracker.app>";

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // Fetch all active alerts
  const { data: alerts, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("fetch alerts error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!alerts || alerts.length === 0) {
    return new Response(JSON.stringify({ checked: 0, triggered: 0 }));
  }

  let triggered = 0;

  for (const alert of alerts) {
    try {
      // Fetch current price from card-price API
      const priceRes = await fetch(
        `${SITE_URL}/api/card-price?cardId=${encodeURIComponent(alert.card_id)}&game=${encodeURIComponent(alert.game)}`
      );

      if (!priceRes.ok) continue;

      const priceData = await priceRes.json();
      const currentPrice: number | null = priceData.currentPrice ?? null;

      if (currentPrice === null) continue;

      // Always keep last_price updated
      await supabase
        .from("price_alerts")
        .update({ last_price: currentPrice })
        .eq("id", alert.id);

      // Evaluate threshold
      const shouldFire =
        alert.direction === "below"
          ? currentPrice <= alert.target_price
          : currentPrice >= alert.target_price;

      if (!shouldFire) continue;

      // Respect 24-hour cooldown per alert
      if (alert.last_triggered_at) {
        const lastFired = new Date(alert.last_triggered_at).getTime();
        if (Date.now() - lastFired < 24 * 60 * 60 * 1000) continue;
      }

      // Get user email via admin API
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(alert.user_id);
      if (userError || !user?.email) continue;

      // Send email via Resend
      if (RESEND_API_KEY) {
        const dirLabel  = alert.direction === "below" ? "dropped below" : "risen above";
        const emailBody = buildEmailHtml({
          cardName:    alert.card_name,
          cardImage:   alert.card_image,
          game:        alert.game,
          targetPrice: alert.target_price,
          currentPrice,
          direction:   alert.direction,
          siteUrl:     SITE_URL,
        });

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    RESEND_FROM,
            to:      user.email,
            subject: `🔔 Price Alert: ${alert.card_name} has ${dirLabel} €${Number(alert.target_price).toFixed(2)}`,
            html:    emailBody,
          }),
        });

        if (!emailRes.ok) {
          console.error("Resend error:", await emailRes.text());
        }
      } else {
        console.warn("RESEND_API_KEY not set — skipping email for alert", alert.id);
      }

      // Mark triggered
      await supabase
        .from("price_alerts")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", alert.id);

      triggered++;
    } catch (err) {
      console.error(`error processing alert ${alert.id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ checked: alerts.length, triggered }),
    { headers: { "Content-Type": "application/json" } }
  );
});

// ── HTML email template ──────────────────────────────────────────────────────

function buildEmailHtml(p: {
  cardName:    string;
  cardImage:   string | null;
  game:        string;
  targetPrice: number;
  currentPrice: number;
  direction:   string;
  siteUrl:     string;
}): string {
  const { cardName, cardImage, game, targetPrice, currentPrice, direction, siteUrl } = p;
  const dirLabel = direction === "below" ? "dropped below" : "risen above";
  const priceDiff = Math.abs(currentPrice - targetPrice).toFixed(2);
  const diffColor = direction === "below" ? "#4ade80" : "#f87171";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f1115;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1115;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">

        <!-- Logo / Header -->
        <tr><td style="text-align:center;padding-bottom:32px">
          <div style="display:inline-block;background:#16191f;border:1px solid #2a2d35;border-radius:12px;padding:12px 20px">
            <span style="color:#d4af37;font-weight:700;font-size:18px;letter-spacing:.05em">TCG Tracker</span>
          </div>
        </td></tr>

        <!-- Bell Icon -->
        <tr><td style="text-align:center;padding-bottom:16px">
          <div style="font-size:48px">🔔</div>
          <h1 style="color:#fff;font-size:22px;margin:8px 0 4px;font-weight:700">Price Alert Triggered</h1>
          <p style="color:#6b7280;font-size:14px;margin:0">Your target was reached</p>
        </td></tr>

        <!-- Card image -->
        ${cardImage ? `
        <tr><td style="text-align:center;padding-bottom:20px">
          <img src="${cardImage}" alt="${cardName}" style="height:150px;border-radius:10px;object-fit:contain"/>
        </td></tr>` : ""}

        <!-- Card details box -->
        <tr><td>
          <div style="background:#16191f;border:1px solid #2a2d35;border-radius:14px;padding:24px;margin-bottom:20px">
            <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.12em">${game}</p>
            <h2 style="margin:0 0 20px;font-size:20px;color:#fff;font-weight:700">${cardName}</h2>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #1f2127;color:#9ca3af;font-size:14px">Current Price</td>
                <td style="padding:10px 0;border-bottom:1px solid #1f2127;text-align:right;color:#d4af37;font-weight:700;font-family:monospace;font-size:18px">€${currentPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #1f2127;color:#9ca3af;font-size:14px">Your Target</td>
                <td style="padding:10px 0;border-bottom:1px solid #1f2127;text-align:right;color:#f3f4f6;font-family:monospace;font-size:15px">€${targetPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9ca3af;font-size:14px">Difference</td>
                <td style="padding:10px 0;text-align:right;color:${diffColor};font-family:monospace;font-weight:700">€${priceDiff}</td>
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- Summary text -->
        <tr><td style="padding-bottom:24px;text-align:center">
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0">
            The market price of <strong style="color:#fff">${cardName}</strong> has
            <strong style="color:#d4af37"> ${dirLabel} your target of €${targetPrice.toFixed(2)}</strong>.
          </p>
        </td></tr>

        <!-- CTA button -->
        <tr><td style="text-align:center;padding-bottom:32px">
          <a href="${siteUrl}/market"
             style="display:inline-block;background:linear-gradient(135deg,#f6d159,#d4af37);color:#0f1115;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;letter-spacing:.02em">
            Browse Market →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding-top:16px;border-top:1px solid #1a1d23">
          <p style="color:#374151;font-size:12px;margin:0">
            TCG Tracker &nbsp;·&nbsp;
            <a href="${siteUrl}/settings" style="color:#4b5563;text-decoration:none">Manage alerts</a>
            &nbsp;·&nbsp;
            <a href="${siteUrl}/settings" style="color:#4b5563;text-decoration:none">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
