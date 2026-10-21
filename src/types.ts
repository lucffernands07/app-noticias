export type Category =
  | "geral"
  | "politica"
  | "tecnologia"
  | "economia"
  | "mundo"
  | "saude"
  | "futebol";

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
  fetchedAt?: string;
  error?: string;
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "politica", label: "Política" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "economia", label: "Economia" },
  { id: "mundo", label: "Mundo" },
  { id: "saude", label: "Saúde" },
  { id: "futebol", label: "Futebol" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  politica: "Política",
  tecnologia: "Tecnologia",
  economia: "Economia",
  mundo: "Mundo",
  saude: "Saúde",
  futebol: "Futebol",
};
