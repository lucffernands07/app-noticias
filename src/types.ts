// Aceita 'geral' ou qualquer outro tema/palavra-chave adicionado pelo utilizador
export type Category = string;

export type NewsItem = {
  title: string;
  link: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string | null;
};

export type NewsResponse = {
  items: NewsItem[];
  categories?: string[];
  fetchedAt?: string;
  error?: string;
};

// Categorias padrão sugeridas para quando o utilizador ainda não adicionou personalizações
export const DEFAULT_CATEGORIES: { id: Category; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "ti", label: "TI" },
  { id: "ia", label: "IA" },
  { id: "windows", label: "Windows" },
  { id: "cloud", label: "Cloud" },
  { id: "corinthians", label: "Corinthians" },
  { id: "politica", label: "Política" },
];
