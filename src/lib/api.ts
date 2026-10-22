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

export async function fetchNews(selectedCategory: string = "geral", customTopics: string[] = []): Promise<NewsResponse> {
  try {
    const res = await fetch("./news.json?" + new Date().getTime());
    if (!res.ok) throw new Error("Não foi possível carregar o arquivo de notícias.");

    const data = await res.json();
    const allItems: NewsItem[] = data.items || [];
    const availableCategories: string[] = data.categories || [];

    // Se for 'geral', filtra unicamente com base nos tópicos ativos definidos pelo utilizador
    if (selectedCategory.toLowerCase() === "geral") {
      if (customTopics.length === 0) {
        return { items: [], categories: availableCategories, fetchedAt: data.fetchedAt };
      }

      const normalizedTopics = customTopics.map(t => t.toLowerCase());
      const filteredGeneral = allItems.filter(item => 
        normalizedTopics.includes(item.category.toLowerCase())
      );

      return {
        items: filteredGeneral,
        categories: availableCategories,
        fetchedAt: data.fetchedAt || new Date().toISOString()
      };
    }

    // Filtra estritamente as notícias da categoria selecionada
    const filtered = allItems.filter(
      (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
    );

    return {
      items: filtered,
      categories: availableCategories,
      fetchedAt: data.fetchedAt || new Date().toISOString()
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], categories: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
}
