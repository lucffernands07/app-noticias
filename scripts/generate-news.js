import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temas padrão que serão buscados automaticamente
const DEFAULT_KEYWORDS = ["TI", "Microsoft", "Windows", "IA", "Cloud", "Corinthians", "Política"];

function cleanText(input) {
  if (!input) return "";
  let out = input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  out = out.replace(/<[^>]*>/g, " ");
  out = out.replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&apos;/g, "'")
             .replace(/&nbsp;/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

async function fetchGoogleNewsFeed(keyword) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i);
      const descMatch = block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i);
      const dateMatch = block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);

      const rawTitle = cleanText(titleMatch ? titleMatch[1] : "");
      const link = cleanText(linkMatch ? linkMatch[1] : "");
      const summary = cleanText(descMatch ? descMatch[1] : "").slice(0, 280);
      const pubDate = dateMatch ? cleanText(dateMatch[1]) : new Date().toISOString();
      const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : "Google News";

      if (rawTitle && link) {
        items.push({
          title: rawTitle,
          link,
          summary: summary || rawTitle,
          source: sourceName,
          category: keyword.toLowerCase(),
          publishedAt: new Date(pubDate).toISOString()
        });
      }
    }
    return items;
  } catch (e) {
    return [];
  }
}

async function main() {
  let allItems = [];

  for (const kw of DEFAULT_KEYWORDS) {
    const items = await fetchGoogleNewsFeed(kw);
    allItems.push(...items);
  }

  // Deduplicação por título
  const seen = new Set();
  allItems = allItems.filter(it => {
    const key = it.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordenar pelas notícias mais recentes de todas
  allItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const output = {
    fetchedAt: new Date().toISOString(),
    categories: DEFAULT_KEYWORDS,
    items: allItems
  };

  const targetDir = path.join(__dirname, '../public');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  fs.writeFileSync(path.join(targetDir, 'news.json'), JSON.stringify(output, null, 2));
  console.log(`Concluído! ${allItems.length} notícias recolhidas para as categorias dinâmicas.`);
}

main();
