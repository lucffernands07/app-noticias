import type { Category, NewsResponse } from "@/types";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function fetchNews(category: Category): Promise<NewsResponse> {
  const url = `${FUNCTION_URL}?category=${encodeURIComponent(category)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let message = `Falha ao buscar notícias (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse error */
    }
    return { items: [], error: message };
  }

  const data = (await res.json()) as NewsResponse;
  if (!data || !Array.isArray(data.items)) {
    return { items: [], error: "Resposta inválida do servidor." };
  }
  return data;
}

// Fallback: open a Google search for the exact title when a direct link is
// unavailable or likely broken. Uses the News vertical for relevance.
export function googleSearchUrl(title: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    title
  )}&tbm=nws`;
}
