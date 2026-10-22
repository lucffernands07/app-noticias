export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
}

export interface NewsResponse {
  items: NewsItem[];
  categories?: string[];
  fetchedAt?: string;
  error?: string;
}

function cleanText(input: string): string {
  if (!input) return "";
  let out = input.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  out = out.replace(/<[^>]*>/g, " ");
  out = out.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  out = out.replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&apos;/g, "'")
             .replace(/&nbsp;/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

export async function fetchNews(selectedCategory: string = "geral", customTopics: string[] = []): Promise<NewsResponse> {
  try {
    const res = await fetch("./news.json?" + new Date().getTime());
    let allItems: NewsItem[] = [];
    let availableCategories: string[] = [];
    let fetchedAtTime = new Date().toISOString();

    if (res.ok) {
      const data = await res.json();
      allItems = data.items || [];
      availableCategories = data.categories || [];
      if (data.fetchedAt) {
        fetchedAtTime = data.fetchedAt;
      }
    }

    if (selectedCategory.toLowerCase() === "geral") {
      if (customTopics.length === 0) {
        return { items: [], categories: availableCategories, fetchedAt: fetchedAtTime };
      }

      const normalizedTopics = customTopics.map(t => t.toLowerCase());
      let filteredGeneral: NewsItem[] = [];

      // Pega estritamente APENAS A 1 NOTÍCIA MAIS RECENTE de cada tópico ativo
      normalizedTopics.forEach(topic => {
        const topicItems = allItems.filter(item => item.category.toLowerCase() === topic);
        if (topicItems.length > 0) {
          topicItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          filteredGeneral.push(topicItems[0]); // Apenas o topo (mais recente) deste tema
        }
      });

      // Ordena o painel geral da mais recente para a mais antiga entre os diferentes tópicos
      filteredGeneral.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return {
        items: filteredGeneral,
        categories: availableCategories,
        fetchedAt: fetchedAtTime
      };
    }

    // Tenta filtrar do JSON estático
    let filtered = allItems.filter(
      (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
    );

    // Se não existir no JSON estático, busca imediatamente em tempo real via Google RSS
    if (filtered.length === 0) {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(selectedCategory)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        const rssRes = await fetch(proxyUrl);

        if (rssRes.ok) {
          const xml = await rssRes.text();
          const parser = new window.DOMParser();
          const xmlDoc = parser.parseFromString(xml, "text/xml");
          const xmlItems = xmlDoc.querySelectorAll("item");

          xmlItems.forEach((node) => {
            const rawTitle = cleanText(node.querySelector("title")?.textContent || "");
            const link = cleanText(node.querySelector("link")?.textContent || "");
            const summary = cleanText(node.querySelector("description")?.textContent || "").slice(0, 280);
            const pubDate = node.querySelector("pubDate")?.textContent || new Date().toISOString();
            const sourceName = cleanText(node.querySelector("source")?.textContent || "Google News");

            if (rawTitle && link) {
              filtered.push({
                title: rawTitle,
                link,
                summary: summary || rawTitle,
                source: sourceName,
                category: selectedCategory.toLowerCase(),
                publishedAt: new Date(pubDate).toISOString()
              });
            }
          });
        }
      } catch (e) {
        console.error("Erro ao buscar tópico em tempo real:", e);
      }
    }

    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return {
      items: filtered,
      categories: availableCategories,
      fetchedAt: fetchedAtTime
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], categories: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
}
