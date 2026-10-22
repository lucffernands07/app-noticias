import type { Category, NewsResponse } from "@/types";

export async function fetchNews(category: Category): Promise<NewsResponse> {
  try {
    const res = await fetch("./news.json?" + new Date().getTime());
    if (!res.ok) throw new Error("Não foi possível carregar as notícias.");

    const data = await res.json();
    const allItems: any[] = data.items || [];

    // Se for 'geral', retorna tudo. Caso contrário, filtra estritamente pela categoria exata.
    const filteredItems = category === "geral"
      ? allItems
      : allItems.filter((item: any) => item.category === category);

    return {
      items: filteredItems,
      fetchedAt: data.fetchedAt || new Date().toISOString()
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar notícias";
    return { items: [], error: message };
  }
}

export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}&tbm=nws`;
}
