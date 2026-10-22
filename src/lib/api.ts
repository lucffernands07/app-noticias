import type { Category, NewsResponse } from "@/types";

// Mapeamento de múltiplos feeds por categoria (primeiro link e segundo link alternativo)
const FEEDS_MAP: Record<string, string[]> = {
  geral: [
    "https://noticias.uol.com.br/index.xml",
    "https://g1.globo.com/rss/g1/"
  ],
  politica: [
    "https://feeds.folha.uol.com.br/poder/rss091.xml",
    "https://g1.globo.com/rss/g1/politica/"
  ],
  tecnologia: [
    "https://tecnoblog.net/feed/",
    "https://g1.globo.com/rss/g1/tecnologia/"
  ],
  economia: [
    "https://www.infomoney.com.br/feed/",
    "https://g1.globo.com/rss/g1/economia/"
  ],
  mundo: [
    "https://g1.globo.com/rss/g1/mundo/"
  ],
  saude: [
    "https://g1.globo.com/rss/g1/ciencia-e-saude/"
  ],
  futebol: [
    "https://ge.globo.com/rss/ge/futebol/"
  ]
};

// Feed de fallback garantido (G1 Geral) caso ocorra algum problema
const FALLBACK_FEED = "https://g1.globo.com/rss/g1/";

function stripHtml(input: string): string {
  let out = input.replace(/<[^>]*>/g, " ");
  out = out.replace(/&amp;/g, "&");
  out = out.replace(/&lt;/g, "<");
  out = out.replace(/&gt;/g, ">");
  out = out.replace(/&quot;/g, '"');
  out = out.replace(/&#39;/g, "'");
  out = out.replace(/&nbsp;/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

async function fetchFeedItems(feedUrl: string, category: Category): Promise<any[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) return [];

    return data.items.map((item: any) => ({
      title: stripHtml(item.title || ""),
      link: item.link || "",
      summary: stripHtml(item.description || item.title || "").slice(0, 280),
      source: feedUrl.includes("ge.globo.com") ? "GE" : feedUrl.includes("folha") ? "Folha" : feedUrl.includes("tecnoblog") ? "Tecnoblog" : feedUrl.includes("infomoney") ? "Infomoney" : feedUrl.includes("uol") ? "UOL" : "G1",
      category,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function fetchNews(category: Category): Promise<NewsResponse> {
  try {
    const feeds = FEEDS_MAP[category] || FEEDS_MAP["geral"];
    let allItems: any[] = [];

    // Tenta buscar de todos os feeds configurados para a categoria
    for (const url of feeds) {
      const items = await fetchFeedItems(url, category);
      allItems.push(...items);
    }

    // Se não retornar nada, ativa o fallback do G1
    if (allItems.length === 0) {
      const fallbackItems = await fetchFeedItems(FALLBACK_FEED, category);
      allItems.push(...fallbackItems);
    }

    // Remove duplicados por título
    const seen = new Set<string>();
    allItems = allItems.filter((it) => {
      const key = it.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Ordena por data mais recente
    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return { items: allItems.slice(0, 30), fetchedAt: new Date().toISOString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
}
