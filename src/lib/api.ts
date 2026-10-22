import type { Category, NewsResponse } from "@/types";

export async function fetchNews(category: Category): Promise<NewsResponse> {
  try {
    // Lê o ficheiro JSON estático atualizado pelo GitHub Actions
    const res = await fetch("./news.json?" + new Date().getTime());
    if (!res.ok) throw new Error("Não foi possível carregar as notícias.");

    const data = await res.json();
    const allItems = data.items || [];

    // Filtra pela categoria selecionada ou retorna tudo se for 'geral'
    const filteredItems = category === "geral" 
      ? allItems 
      : allItems.filter((item: any) => item.category === category);

    return { 
      items: filteredItems.length > 0 ? filteredItems : allItems, 
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
