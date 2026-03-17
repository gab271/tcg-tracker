import { logger } from "@/lib/logger";

/**
 * One Piece TCG search using the official Bandai card list.
 *
 * GET https://en.onepiece-cardgame.com/cardlist/?search_request[]=true&keyword=QUERY&keyword_type[]=text_number
 *
 * Parses the HTML response to extract card data. Fails gracefully if
 * the HTML structure changes or the site is unavailable.
 */

const BASE_URL = "https://en.onepiece-cardgame.com";
const FETCH_TIMEOUT_MS = 15_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnePieceCardSummary {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  typeLine: string;
  price: number | null;
}

export interface OnePieceSearchResult {
  cards: OnePieceCardSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, body?: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: body ? "POST" : "GET",
      body: body ?? undefined,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("One Piece API timed out");
    }
    throw new Error(`One Piece API unreachable: ${err instanceof Error ? err.message : err}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse card entries from the Bandai HTML card list response.
 *
 * HTML structure:
 *   <div class="resultCol">
 *     <a class="modalOpen" data-src="#OP01-001">
 *       <img class="lazy" data-src="../images/cardlist/card/OP01-001.png" alt="Monkey.D.Luffy">
 *     </a>
 *     <dl class="modalCol" id="OP01-001">
 *       <dt>
 *         <div class="infoCol">
 *           <span>OP01-001</span> | <span>SEC</span> | <span>LEADER</span>
 *         </div>
 *         <div class="cardName">Monkey.D.Luffy</div>
 *       </dt>
 *     </dl>
 *   </div>
 */
function parseCardsFromHtml(html: string): OnePieceCardSummary[] {
  const cards: OnePieceCardSummary[] = [];

  // Split the HTML into individual result columns
  const sections = html.split('class="resultCol"').slice(1);

  for (const section of sections) {
    // Card ID — from data-src="#OP01-001"
    const idMatch = /data-src="#([A-Z0-9]+-\d+)"/.exec(section);
    // Image file — data-src="../images/cardlist/card/OP01-001.png..."
    const imgMatch = /data-src="\.\.\/images\/cardlist\/card\/([^"?]+)"/.exec(section);
    // Card name — <div class="cardName">NAME</div>
    const nameMatch = /<div class="cardName">([^<]+)<\/div>/.exec(section);
    // Rarity — second <span> in infoCol: "OP01-001 | SEC | LEADER"
    const rarityMatch = /<span>[^<]+<\/span>\s*\|\s*<span>([^<]+)<\/span>/.exec(section);
    // Card type — third <span> in infoCol
    const typeMatch =
      /<span>[^<]+<\/span>\s*\|\s*<span>[^<]+<\/span>\s*\|\s*<span>([^<]+)<\/span>/.exec(section);

    if (!idMatch || !nameMatch) {
      logger.warn(
        `[onepiece] Failed to parse card section (idMatch=${!!idMatch}, nameMatch=${!!nameMatch}). ` +
        `Preview: ${section.slice(0, 120).replace(/\n/g, " ")}`
      );
      continue;
    }

    const id = idMatch[1];
    const name = nameMatch[1].trim();
    const imgFile = imgMatch?.[1] ?? `${id}.png`;
    const rarity = rarityMatch?.[1]?.trim() ?? "Common";
    const typeLine = typeMatch?.[1]?.trim() ?? "Character";

    cards.push({
      id,
      name,
      imageUrl: `${BASE_URL}/images/cardlist/card/${imgFile}`,
      rarity,
      typeLine,
      price: null, // Market prices not available via public One Piece API
    });
  }

  return cards;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search One Piece TCG cards via the official Bandai card list.
 * Results are parsed from HTML and paginated client-side.
 */
export async function searchOnePieceCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<OnePieceSearchResult> {
  try {
    // Bandai uses POST with "freewords" for card name search
    const body = new URLSearchParams({ freewords: query });

    const res = await fetchWithTimeout(`${BASE_URL}/cardlist/`, body.toString());

    if (!res.ok) return { cards: [], page, pageSize, total: 0 };

    const html = await res.text();
    const allCards = parseCardsFromHtml(html);

    const start = (page - 1) * pageSize;
    const pageCards = allCards.slice(start, start + pageSize);

    return {
      cards: pageCards,
      page,
      pageSize,
      total: allCards.length,
    };
  } catch (err) {
    logger.warn("[onepiece] searchOnePieceCards failed:", err instanceof Error ? err.message : err);
    return { cards: [], page, pageSize, total: 0 };
  }
}
