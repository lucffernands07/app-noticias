import type { Category, NewsResponse } from "@/types";

// Lista de feeds RSS mapeados por categoria para busca direta no cliente
const FEEDS_MAP: Record<string, { source: string; url: string }[]> = {
  geral: [
    { source: "G1", url: "https://g1.globo.com/rss/g1/" },
    { source: "G1 Política", url: "https://g1.globo.com/rss/g1/politica/" },
    { source: "G1 Economia", url: "https://g1.globo.com/rss/g1/economia/" },
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
    const feeds = FEEDS_MAP[category] || FEEDS_MAP["geral"];
    let allItems: any[] = [];

    for (const feed of feeds) {
      // Usamos um proxy CORS público para contornar o bloqueio do navegador ao ler RSS externo
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(proxyUrl);
      
      if (!res.ok) continue;
      
      const data = await res.json();
      if (!data.contents) continue;

      const parser = new window.DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, "text/xml");
      const rssItems = xmlDoc.querySelectorAll("item");

      rssItems.forEach((el, index) => {
        if (index >= 15) return; // Limita a 15 por feed
        const title = stripHtml(el.querySelector("title")?.textContent || "");
        const link = stripHtml(el.querySelector("link")?.textContent || "");
        const description = stripHtml(el.querySelector("description")?.textContent || "").slice(0, 280);
        const pubDate = el.querySelector("pubDate")?.textContent || new Date().toISOString();

        if (title && link) {
          allItems.push({
            title,
            link,
            summary: description || title,
            source: feed.source,
            category,
            publishedAt: new Date(pubDate).toISOString(),
          });
        }
      });
    }

    // Remover duplicados por título
    const seen = new Set<string>();
    allItems = allItems.filter((it) => {
      const key = it.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { items: allItems, fetchedAt: new Date().toISOString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
        }
