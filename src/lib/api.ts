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

export async function fetchNews(selectedCategory: string = "geral"): Promise<NewsResponse> {
  try {
    const res = await fetch("./news.json?" + new Date().getTime());
    let allItems: NewsItem[] = [];
    let availableCategories: string[] = [];

    if (res.ok) {
      const data = await res.json();
      allItems = data.items || [];
      availableCategories = data.categories || [];
    }

    // Se for 'geral', entrega as notícias mais recentes de TODAS as categorias disponíveis
    if (selectedCategory.toLowerCase() === "geral") {
      return {
        items: allItems,
        categories: availableCategories,
        fetchedAt: new Date().toISOString()
      };
    }

    // Filtra as notícias pertencentes à categoria selecionada no arquivo estático
    let filtered = allItems.filter(
      (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
    );

    // Se não houver notícias no JSON estático (tópico novo criado agora por si),
    // busca as notícias diretamente do Google News em tempo real!
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
        console.error("Erro ao buscar tópico personalizado em tempo real:", e);
      }
    }

    return {
      items: filtered,
      categories: availableCategories,
      fetchedAt: new Date().toISOString()
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], categories: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
          }
