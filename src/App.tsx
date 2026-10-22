import { useCallback, useEffect, useState } from "react";
import { Bookmark, Newspaper } from "lucide-react";
import type { Category, NewsItem } from "@/types";
import { fetchNews } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import {
  useNotificationSettings,
  type Frequency,
} from "@/lib/settings";
import { useNotificationScheduler } from "@/lib/useNotificationScheduler";
import { sendSummaryNow, sendTestNotification } from "@/lib/notifications";
import { Header } from "@/components/Header";
import { Tabs } from "@/components/Tabs";
import { SkeletonList } from "@/components/Skeletons";
import { ErrorState } from "@/components/ErrorState";
import { NewsCard } from "@/components/NewsCard";
import { FavoritesDrawer } from "@/components/FavoritesDrawer";
import { SettingsModal } from "@/components/SettingsModal";

type LoadState = {
  loading: boolean;
  error: string | null;
  items: NewsItem[];
};

const EMPTY: LoadState = { loading: true, error: null, items: [] };

function App() {
  const [category, setCategory] = useState<Category>("geral");
  const [cache, setCache] = useState<Record<string, LoadState>>({});
  const [requested, setRequested] = useState<Set<string>>(new Set(["geral"]));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const {
    settings,
    togglePush,
    requestPermission,
    toggleCategory,
    update,
    markNotified,
  } = useNotificationSettings();
  const [requestingPerm, setRequestingPerm] = useState(false);

  useNotificationScheduler(settings, markNotified);

  // Track the browser's notification permission so the modal reflects the
  // real state (granted / denied / default / unsupported).
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, [settingsOpen]);

  // Respond to the service worker when it asks for the current notification
  // settings (used by the background periodic-sync path).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "GET_SETTINGS") return;
      // Read the latest settings from storage so we always send fresh values.
      try {
        const raw = localStorage.getItem("noticias-hoje:settings");
        const parsed = raw ? JSON.parse(raw) : null;
        (event.ports[0] || event.source)?.postMessage(parsed);
      } catch {
        (event.ports[0] || event.source)?.postMessage(null);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  const load = useCallback(async (cat: Category) => {
    setCache((prev) => ({
      ...prev,
      [cat]: { loading: true, error: null, items: prev[cat]?.items ?? [] },
    }));

    const res = await fetchNews(cat);
    setCache((prev) => ({
      ...prev,
      [cat]: {
        loading: false,
        error: res.error ?? null,
        items: res.items,
      },
    }));
  }, []);

  useEffect(() => {
    if (!requested.has(category)) {
      setRequested((prev) => new Set(prev).add(category));
      load(category);
    }
  }, [category, load, requested]);

  const state = cache[category] ?? EMPTY;

  const handleRetry = () => load(category);

  const handleTogglePush = (enabled: boolean) => {
    togglePush(enabled);
  };

  // Explicit browser permission request triggered by the "Permitir notificações"
  // button in the settings modal.
  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      alert("O seu navegador não suporta notificações.");
      return;
    }

    if (Notification.permission === "denied") {
      alert(
        "As notificações foram bloqueadas nas definições do navegador.\n\nPara permitir: Toque no ícone de definições/cadeado na barra de endereços do Chrome e altere as permissões de Notificações para 'Permitir'."
      );
      return;
    }

    setRequestingPerm(true);
    try {
      const result = await requestPermission();
      if (result !== "unsupported") setNotifPermission(result);
      
      if (result === "granted") {
        togglePush(true);
      } else {
        togglePush(false);
      }

      // Try to register periodic background sync once permission is granted.
      if (result === "granted" && "serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if ("periodicSync" in reg) {
            const ps = (reg as ServiceWorkerRegistration & {
              periodicSync: { register: (tag: string, opts?: object) => Promise<void> };
            }).periodicSync;
            await ps.register("noticias-hoje-periodic", {
              minInterval: 60 * 60 * 1000,
            });
          }
        } catch {
          /* periodic sync not supported — the open-tab interval still works */
        }
      }
    } finally {
      setRequestingPerm(false);
    }
  };

  const handleTestNotification = async () => {
    if (settings.alertCategories.length > 0) {
      await sendSummaryNow(
        settings.alertCategories as Category[],
        settings.frequency
      );
    } else {
      await sendTestNotification();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200">
      <Header
        favoriteCount={favorites.length}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Tabs active={category} onChange={setCategory} />

      <main className="mx-auto max-w-3xl px-4 py-5 pb-24">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[12px] text-gray-500">
            {state.loading && state.items.length === 0
              ? "Buscando as últimas notícias…"
              : state.error
              ? ""
              : `${state.items.length} notícia${
                  state.items.length === 1 ? "" : "s"
                } encontrada${state.items.length === 1 ? "" : "s"}`}
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-gray-300 ring-1 ring-white/5 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Ver depois
            {favorites.length > 0 && (
              <span className="text-cyan-300">{favorites.length}</span>
            )}
          </button>
        </div>

        {state.loading && state.items.length === 0 ? (
          <SkeletonList count={5} />
        ) : state.error ? (
          <ErrorState message={state.error} onRetry={handleRetry} />
        ) : state.items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {state.items.map((item, i) => (
              <NewsCard
                key={`${item.link}-${i}`}
                item={item}
                index={i}
                isFavorite={isFavorite(item.link)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        <footer className="mt-10 border-t border-white/5 pt-5 text-center">
          <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[11px] text-gray-600">
            <Newspaper className="h-3.5 w-3.5" />
            Notícias Hoje
          </div>
          <p className="text-[10.5px] leading-relaxed text-gray-700">
            Fontes: G1 e GE. Conteúdo direto das publicações originais.
            <br />
            Os links levam ao portal de origem. Em caso de falha, abrimos uma
            busca no Google pelo título.
          </p>
        </footer>
      </main>

      <FavoritesDrawer
        open={drawerOpen}
        favorites={favorites}
        onClose={() => setDrawerOpen(false)}
        onRemove={toggleFavorite}
      />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        permission={notifPermission}
        requesting={requestingPerm}
        onClose={() => setSettingsOpen(false)}
        onTogglePush={handleTogglePush}
        onRequestPermission={handleRequestPermission}
        onToggleCategory={toggleCategory}
        onChangeTime={(time) => update({ alertTime: time })}
        onChangeFrequency={(freq: Frequency) => update({ frequency: freq })}
        onTestNotification={handleTestNotification}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-white/5">
        <Newspaper className="h-6 w-6 text-gray-600" />
      </div>
      <h3 className="mb-1 text-[14px] font-semibold text-gray-300">
        Sem notícias no momento
      </h3>
      <p className="text-[12.5px] text-gray-500">
        Tente novamente em alguns instantes.
      </p>
    </div>
  );
}

export default App;
      
