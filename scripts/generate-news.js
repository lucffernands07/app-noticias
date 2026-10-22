import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEEDS = [
  { url: "https://noticias.uol.com.br/index.xml", category: "geral", source: "UOL" },
  { url: "https://g1.globo.com/rss/g1/", category: "geral", source: "G1" },
  { url: "https://feeds.folha.uol.com.br/poder/rss091.xml", category: "politica", source: "Folha" },
  { url: "https://g1.globo.com/rss/g1/politica/", category: "politica", source: "G1" },
  { url: "https://tecnoblog.net/feed/", category: "tecnologia", source: "Tecnoblog" },
  { url: "https://g1.globo.com/rss/g1/tecnologia/", category: "tecnologia", source: "G1" },
  { url: "https://www.infomoney.com.br/feed/", category: "economia", source: "Infomoney" },
  { url: "https://g1.globo.com/rss/g1/economia/", category: "economia", source: "G1" },
  { url: "https://g1.globo.com/rss/g1/mundo/", category: "mundo", source: "G1" },
  { url: "https://g1.globo.com/rss/g1/ciencia-e-saude/", category: "saude", source: "G1" },
  { url: "https://ge.globo.com/rss/ge/futebol/", category: "futebol", source: "GE" }
];

function stripHtml(input) {
  if (!input) return "";
  let out = input.replace(/<!\[CDATA\[\vert{}\]\]>/g, "");
  out = out.replace(/<[^>]*>/g, " ");
  out = out.replace(/&amp;/g, "&");
  out = out.replace(/&lt;/g, "<");
  out = out.replace(/&gt;/g, ">");
  out = out.replace(/&quot;/g, '"');
  out = out.replace(/&#39;/g, "'");
  out = out.replace(/&nbsp;/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

async function fetchRss(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    
    const items = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || block.match(/<link\b[^>]*href="([^"]+)"/i);
      const descMatch = block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i);
      const dateMatch = block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i);

      const title = stripHtml(titleMatch ? titleMatch[1] : "");
      const link = stripHtml(linkMatch ? (linkMatch[1] || linkMatch[2] || "") : "");
      const summary = stripHtml(descMatch ? descMatch[1] : "").slice(0, 280);
      const pubDate = dateMatch ? stripHtml(dateMatch[1]) : new Date().toISOString();

      if (title && link) {
        items.push({
          title,
          link,
          summary: summary || title,
          source: feed.source,
          category: feed.category,
          publishedAt: new Date(pubDate).toISOString()
        });
      }
    }
    return items;
  } catch (e) {
    console.error(`Erro ao buscar feed ${feed.url}:`, e.message);
    return [];
  }
}

async function main() {
  let allItems = [];
  for (const feed of FEEDS) {
    const items = await fetchRss(feed);
    allItems.push(...items);
  }

  // Remover duplicados
  const seen = new Set();
  allItems = allItems.filter(it => {
    const key = it.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordenar por mais recente
  allItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const output = {
    fetchedAt: new Date().toISOString(),
    items: allItems.slice(0, 60)
  };

  const targetDir = path.join(__dirname, '../public');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(path.join(targetDir, 'news.json'), JSON.stringify(output, null, 2));
  console.log(`Sucesso! ${allItems.length} notícias guardadas em public/news.json`);
}

main();
