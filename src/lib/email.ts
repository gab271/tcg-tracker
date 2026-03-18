/** Email utilities for transactional emails sent via Resend. */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function buildPriceAlertEmail(params: {
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

  const safeName = escapeHtml(cardName);
  const safeGame = escapeHtml(game);
  const safeImage = cardImage ? escapeHtml(cardImage) : null;
  const safeSiteUrl = escapeHtml(siteUrl);

  return `
<!DOCTYPE html>
<html>
<body style="background:#0f1115;color:#f3f4f6;font-family:system-ui,sans-serif;margin:0;padding:32px">
  <div style="max-width:520px;margin:0 auto">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">🔔</span>
      <h1 style="color:#d4af37;font-size:22px;margin:8px 0">Price Alert Triggered</h1>
    </div>
    ${safeImage ? `<div style="text-align:center;margin-bottom:20px"><img src="${safeImage}" alt="${safeName}" style="height:140px;border-radius:8px"/></div>` : ""}
    <div style="background:#16191f;border:1px solid #2a2d35;border-radius:12px;padding:24px;margin-bottom:20px">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em">${safeGame}</p>
      <h2 style="margin:0 0 16px;font-size:20px;color:#fff">${safeName}</h2>
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
      The price of <strong style="color:#fff">${safeName}</strong> has ${dirLabel} your target of <strong style="color:#d4af37">€${targetPrice.toFixed(2)}</strong>.
    </p>
    <div style="text-align:center;margin-top:24px">
      <a href="${safeSiteUrl}/market" style="display:inline-block;background:#d4af37;color:#0f1115;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px">Browse Market →</a>
    </div>
    <p style="color:#374151;font-size:12px;text-align:center;margin-top:32px">
      TCG Tracker · <a href="${safeSiteUrl}/settings" style="color:#6b7280">Manage alerts</a>
    </p>
  </div>
</body>
</html>`;
}
