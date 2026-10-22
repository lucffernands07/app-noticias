import type { Category, NewsResponse } from "@/types";

const FEEDS_MAP: Record<string, { source: string; url: string }[]> = {
  geral: [
    { source: "Google Trends", url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR" },
    { source: "G1", url: "https://g1.globo.com/rss/g1/" },
    { source: "G1 Política", url: "https://g1.globo.com/rss/g1/politica/" },
  ],
  politica: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/politica/" }
  ],
  tecnologia: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/tecnologia/" }
  ],
  economia: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/economia/" }
  ],
  mundo: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/mundo/" }
  ],
  saude: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/ciencia-e-saude/" }
  ],
  futebol: [
    { source: "GE", url: "https://ge.globo.com/rss/ge/futebol/" }
  ]
};

function stripHtml(input: string): string {
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

export async function fetchNews(category: Category): Promise<NewsResponse> {
  try {
    let feeds = FEEDS_MAP[category] || FEEDS_MAP["geral"];
    let allItems: any[] = [];

    for (const feed of feeds) {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) continue;

      const data = await res.json();
      const xml = data.contents || "";
      if (!xml) continue;

      const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1] || "";
        const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
        const linkMatch = block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || block.match(/<link\b[^>]*href="([^"]+)"/i);
        const descMatch = block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i);
        const dateMatch = block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i);

        const title = stripHtml(titleMatch ? titleMatch[1] : "");
        const link = stripHtml(linkMatch ? (linkMatch[1] || linkMatch[2] || "") : "");
        const summary = stripHtml(descMatch ? descMatch[1] : "").slice(0, 280);
        const pubDate = dateMatch ? stripHtml(dateMatch[1]) : new Date().toISOString();

        if (title && link) {
          allItems.push({
            title,
            link,
            summary: summary || title,
            source: feed.source,
            category,
            publishedAt: new Date(pubDate).toISOString(),
          });
        }
      }
    }

    if (allItems.length === 0 && category !== "geral") {
      return fetchNews("geral");
    }

    const seen = new Set<string>();
    allItems = allItems.filter((it) => {
      const key = it.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { items: allItems, fetchedAt: new Date().toISOString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar tendências";
    return { items: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
}
