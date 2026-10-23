// Aceita 'geral' ou qualquer outro tema/palavra-chave escolhido
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

// Categorias padrão sugeridas para seleção
export const DEFAULT_CATEGORIES: { id: Category; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "ti", label: "TI" },
  { id: "ia", label: "IA" },
  { id: "windows", label: "Windows" },
  { id: "cloud", label: "Cloud" },
  { id: "corinthians", label: "Corinthians" },
  { id: "politica", label: "Política" },
];

// Mapeamento exigido pelo notifications.ts para exibir os nomes legíveis das opções disponíveis
export const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  ti: "TI",
  ia: "IA",
  windows: "Windows",
  cloud: "Cloud",
  corinthians: "Corinthians",
  politica: "Política",
  Tecnologia: "Tecnologia",
  Política: "Política",
  Economia: "Economia",
  Brasil: "Brasil",
  Mundo: "Mundo",
  "Inteligência Artificial": "Inteligência Artificial",
  Futebol: "Futebol",
  "Fórmula 1": "Fórmula 1",
  Ciência: "Ciência",
  Astronomia: "Astronomia",
  Cultura: "Cultura",
  Saúde: "Saúde",
};
