// Edge Function: news
// Fetches and parses Brazilian RSS feeds per category and returns normalized
// news items. Runs server-side so we avoid browser CORS restrictions and can
// parse XML directly.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type FeedItem = {
  title: string;
  link: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string | null;
};

type FeedDef = {
  source: string;
  category: string;
  url: string;
};

// Reliable Brazilian news RSS feeds. Each entry maps a portal + category to a
// feed URL. These are the canonical, real portal links.
const FEEDS: FeedDef[] = [
  // G1 - Geral
  { source: "G1", category: "geral", url: "https://g1.globo.com/rss/g1/" },
  // G1 - Politica
  { source: "G1", category: "politica", url: "https://g1.globo.com/rss/g1/politica/" },
  // G1 - Tecnologia
  { source: "G1", category: "tecnologia", url: "https://g1.globo.com/rss/g1/tecnologia/" },
  // G1 - Economia
  { source: "G1", category: "economia", url: "https://g1.globo.com/rss/g1/economia/" },
  // G1 - Mundo
  { source: "G1", category: "mundo", url: "https://g1.globo.com/rss/g1/mundo/" },
  // G1 - Saude
  { source: "G1", category: "saude", url: "https://g1.globo.com/rss/g1/ciencia-e-saude/" },
  // GE - Futebol
  { source: "GE", category: "futebol", url: "https://ge.globo.com/rss/ge/futebol/" },
];

function stripHtml(input: string): string {
  // Remove HTML tags and decode common entities, then collapse whitespace.
  let out = input.replace(/<!\[CDATA\[\vert{}\]\]>/g, "");
  out = out.replace(/<[^>]*>/g, " ");
  out = out.replace(/&amp;/g, "&");
  out = out.replace(/&lt;/g, "<");
  out = out.replace(/&gt;/g, ">");
  out = out.replace(/&quot;/g, '"');
  out = out.replace(/&#39;/g, "'");
  out = out.replace(/&nbsp;/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function parseDate(input: string | null): string | null {
  if (!input) return new Date().toISOString(); // Fallback para data atual se faltar no RSS
  const d = new Date(input);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

// Minimal RSS/Atom parser. Extracts items via regex so we don't depend on a
// DOM parser implementation. Tolerates CDATA, namespaces, and varying item
// structures across portals.
function parseFeed(xml: string, feed: FeedDef): FeedItem[] {
  const items: FeedItem[] = [];

  // RSS <item> blocks
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  // Atom <entry> blocks
  const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;

  const blockRegex = new RegExp(
    `${itemRegex.source}|${entryRegex.source}`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(xml)) !== null) {
    const block = match[1] || match[2] || "";

    const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch =
      block.match(/<link\b[^>]*href="([^"]+)"/i) ||
      block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i);
    const descMatch = block.match(
      /<description\b[^>]*>([\s\S]*?)<\/description>/i
    ) || block.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
    const dateMatch = block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<published\b[^>]*>([\s\S]*?)<\/published>/i) ||
      block.match(/<updated\b[^>]*>([\s\S]*?)<\/updated>/i);

    const title = stripHtml(titleMatch ? titleMatch[1] : "");
    let link = linkMatch ? (linkMatch[1] || linkMatch[2] || "") : "";
    link = stripHtml(link);

    if (!title || !link) continue;

    const summary = stripHtml(descMatch ? descMatch[1] : "").slice(0, 280);

    items.push({
      title,
      link,
      summary: summary || title,
      source: feed.source,
      category: feed.category,
      publishedAt: parseDate(dateMatch ? stripHtml(dateMatch[1]) : null),
    });

    if (items.length >= 20) break;
  }

  return items;
}

async function fetchFeed(feed: FeedDef): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NoticiasHojeBot/1.0; +https://noticiashoje.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, feed);
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = (url.searchParams.get("category") || "geral")
      .toLowerCase()
      .trim();

    let feeds: FeedDef[];
    if (category === "geral") {
      feeds = FEEDS.filter((f) =>
        ["geral", "politica", "economia", "mundo"].includes(f.category)
      );
    } else {
      feeds = FEEDS.filter((f) => f.category === category);
    }

    if (feeds.length === 0) {
      feeds = FEEDS.filter((f) => f.category === "geral");
    }

    let results = await Promise.all(feeds.map(fetchFeed));
    let items = results.flat();

    // Se a categoria específica veio vazia, faz fallback automático para o feed geral
    if (items.length === 0 && category !== "geral") {
      const fallbackFeeds = FEEDS.filter((f) => f.category === "geral");
      const fallbackResults = await Promise.all(fallbackFeeds.map(fetchFeed));
      items = fallbackResults.flat();
    }

    // Deduplicate by title (case-insensitive).
    const seen = new Set<string>();
    items = items.filter((it) => {
      const key = it.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by published date descending
    items.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    items = items.slice(0, 30);

    return new Response(
      JSON.stringify({ items, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message, items: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
      
