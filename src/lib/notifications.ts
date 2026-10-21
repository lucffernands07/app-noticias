import type { Category, NewsItem } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { fetchNews } from "@/lib/api";
import type { Frequency } from "@/lib/settings";

const NOTIFICATION_TAG = "noticias-hoje-resumo";

// Fetch the latest headlines for the given alert categories and build a
// summary notification body. For "urgentes" frequency, only items published
// in the last 6 hours are kept.
export async function buildSummary(
  categories: Category[],
  frequency: Frequency
): Promise<{ items: NewsItem[]; body: string; title: string }> {
  const results = await Promise.all(categories.map((c) => fetchNews(c)));
  let items: NewsItem[] = [];
  for (const r of results) {
    if (r.items) items = items.concat(r.items);
  }

  // Deduplicate by title.
  const seen = new Set<string>();
  items = items.filter((it) => {
    const key = it.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (frequency === "urgentes") {
    const cutoff = Date.now() - 6 * 60 * 60 * 1000;
    items = items.filter(
      (it) => it.publishedAt && new Date(it.publishedAt).getTime() >= cutoff
    );
  }

  const top = items.slice(0, 5);
  const catNames = categories.map((c) => CATEGORY_LABELS[c] || c).join(", ");

  const title = `Resumo de Notícias — Notícias Hoje`;
  const body =
    top.length === 0
      ? `Sem novidades em ${catNames} no momento.`
      : top.length === 1
      ? top[0].title
      : `${top[0].title}\n+ ${top.length - 1} outras notícias (${catNames})`;

  return { items: top, body, title };
}

// Show a notification via the service worker when available, falling back to
// the plain Notification constructor. Returns true if a notification was shown.
export async function showNotification(
  title: string,
  body: string,
  options?: { tag?: string; url?: string }
): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const tag = options?.tag ?? NOTIFICATION_TAG;
  const icon = "/icon.svg";

  // Prefer the service worker so notifications work even when the tab is not
  // focused (and for better mobile support).
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon,
        tag,
        data: { url: options?.url || "/" },
      });
      return true;
    } catch {
      // Fall through to the Notification constructor below.
    }
  }

  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag,
      data: { url: options?.url || "/" },
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

// Fire a test notification immediately so the user can verify permissions.
export async function sendTestNotification(): Promise<boolean> {
  return showNotification(
    "Notícias Hoje — Teste",
    "Notificações ativadas com sucesso! Você receberá seu resumo no horário programado.",
    { tag: "noticias-hoje-teste" }
  );
}

// Fetch headlines for the selected categories and fire a real summary
// notification right now (used both by the scheduler and the test button when
// the user wants to preview the actual summary).
export async function sendSummaryNow(
  categories: Category[],
  frequency: Frequency
): Promise<boolean> {
  if (categories.length === 0) {
    return sendTestNotification();
  }
  try {
    const { body, title, items } = await buildSummary(categories, frequency);
    const url = items[0]?.link || "/";
    return showNotification(title, body, { url });
  } catch {
    return false;
  }
}
