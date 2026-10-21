import { useCallback, useEffect, useState } from "react";
import type { NewsItem } from "@/types";

const STORAGE_KEY = "noticias-hoje:favorites";

function load(): NewsItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Favorites are stored locally (no auth). Each favorite is keyed by its link.
export function useFavorites() {
  const [favorites, setFavorites] = useState<NewsItem[]>([]);

  useEffect(() => {
    setFavorites(load());
  }, []);

  const persist = (items: NewsItem[]) => {
    setFavorites(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  };

  const isFavorite = useCallback(
    (link: string) => favorites.some((f) => f.link === link),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (item: NewsItem) => {
      const exists = favorites.some((f) => f.link === item.link);
      const next = exists
        ? favorites.filter((f) => f.link !== item.link)
        : [item, ...favorites];
      persist(next);
    },
    [favorites]
  );

  return { favorites, isFavorite, toggleFavorite };
}
