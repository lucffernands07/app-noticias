import React, { useState, useEffect, useRef } from "react";
import { fetchNews } from "./lib/api";
import { sendSummaryNow } from "./lib/notifications";
import { useNotificationScheduler } from "./lib/useNotificationScheduler";
import type { NewsItem } from "./types";
import type { NotificationSettings } from "./lib/settings";

export function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["geral"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados de Notificação alinhados com o módulo original
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationTime, setNotificationTime] = useState<string>("08:00");
  const [lastNotifiedAt, setLastNotifiedAt] = useState<string | undefined>(undefined);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const navRef = useRef<HTMLDivElement>(null);

  const PRESET_OPTIONS = [
    "Tecnologia",
    "Política",
    "Economia",
    "Brasil",
    "Mundo",
    "Inteligência Artificial",
    "Futebol",
    "Fórmula 1",
    "Ciência",
    "Astronomia",
    "Cultura",
    "Saúde"
  ];

  // Carrega configurações do localStorage ao iniciar
  useEffect(() => {
    const savedTopics = localStorage.getItem("user_custom_topics");
    if (savedTopics) {
      try {
        setTopics(JSON.parse(savedTopics));
      } catch (e) {
        setTopics([]);
      }
    }

    const savedNotifs = localStorage.getItem("notifs_enabled");
    if (savedNotifs) {
      try {
        setNotificationsEnabled(JSON.parse(savedNotifs));
      } catch {
        setNotificationsEnabled(false);
      }
    }

    const savedTime = localStorage.getItem("notifs_time");
    if (savedTime) setNotificationTime(savedTime);

    const savedLast = localStorage.getItem("last_notified_at");
    if (savedLast) setLastNotifiedAt(savedLast);
  }, []);

  // Objeto de configurações compatível com o tipo NotificationSettings original
  const notificationSettings: NotificationSettings = {
    pushEnabled: notificationsEnabled,
    alertTime: notificationTime,
    frequency: "diario",
    alertCategories: topics as any,
    lastNotifiedAt: lastNotifiedAt,
  };

  // Callback para atualizar o registo de que o resumo de hoje foi enviado
  const markNotified = () => {
    const nowIso = new Date().toISOString();
    setLastNotifiedAt(nowIso);
    localStorage.setItem("last_notified_at", nowIso);
  };

  // Ativa o agendador original de notificações em segundo plano enquanto a aba estiver aberta
  useNotificationScheduler(notificationSettings, markNotified);

  useEffect(() => {
    const activeTopics = ["geral", ...topics];
    setCategories(activeTopics);

    if (!activeTopics.map(t => t.toLowerCase()).includes(selectedCategory.toLowerCase())) {
      setSelectedCategory("geral");
    }
  }, [topics]);

  // Centraliza automaticamente o botão ativo na barra de navegação
  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector(`[data-category="${selectedCategory.toLowerCase()}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const response = await fetchNews(selectedCategory, topics);

      if (response.error) {
        setError(response.error);
      } else {
        setItems(response.items);
      }
      setLoading(false);
    }

    loadData();
  }, [selectedCategory, topics]);

  const handleAddTopic = () => {
    if (!selectedPreset) return;
    
    if (topics.map(t => t.toLowerCase()).includes(selectedPreset.toLowerCase())) return;

    const updated = [...topics, selectedPreset];
    setTopics(updated);
    localStorage.setItem("user_custom_topics", JSON.stringify(updated));
    setSelectedPreset("");

    setSuccessMessage("Tópico adicionado com sucesso!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    const updated = topics.filter(t => t !== topicToRemove);
    setTopics(updated);
    localStorage.setItem("user_custom_topics", JSON.stringify(updated));
  };

  const handleToggleNotifications = async () => {
    const nextState = !notificationsEnabled;
    if (nextState && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("notifs_enabled", "true");
        // Dispara o resumo de teste imediatamente usando o módulo original
        await sendSummaryNow(topics as any, "diario");
      } else {
        setNotificationsEnabled(false);
        localStorage.setItem("notifs_enabled", "false");
        return;
      }
    } else {
      setNotificationsEnabled(nextState);
      localStorage.setItem("notifs_enabled", JSON.stringify(nextState));
    }
  };

  const cleanSummary = (text: string) => {
    if (!text) return "";
    return text.replace(/<[^>]*>?/gm, "").trim();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return "";
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 75;

    if (Math.abs(distance) > minSwipeDistance) {
      const currentIndex = categories.findIndex(
        cat => cat.toLowerCase() === selectedCategory.toLowerCase()
      );
      
      if (currentIndex !== -1) {
        if (distance > 0) {
          const nextIndex = (currentIndex + 1) % categories.length;
          setSelectedCategory(categories[nextIndex]);
        } else {
          const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
          setSelectedCategory(categories[prevIndex]);
        }
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div 
      className="min-h-screen bg-gray-950 text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className="p-4 border-b border-gray-800 flex justify-between items-center max-w-3xl w-full mx-auto">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">📰</span> 
            Notícias Hoje
          </h1>
          <p className="text-xs text-gray-400">Tendências em tempo real</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-300 transition-colors shadow-sm"
        >
          ⚙️
        </button>
      </header>

      <nav 
        ref={navRef}
        className="flex gap-2 overflow-x-auto py-3 px-4 border-b border-gray-800/50 max-w-3xl w-full mx-auto scrollbar-none touch-pan-x [-webkit-overflow-scrolling:touch]"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            data-category={cat.toLowerCase()}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium capitalize text-sm whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-3xl w-full mx-auto flex-1">
        {loading ? (
          <div className="text-center py-16 text-gray-400 animate-pulse flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Buscando as últimas notícias...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-900/40 border border-gray-800 rounded-2xl max-w-lg mx-auto mt-8 shadow-xl flex flex-col items-center gap-4">
            <span className="text-3xl p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">⚙️</span>
            <h2 className="text-lg font-bold text-white">Nenhuma notícia encontrada</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Para começar a acompanhar o conteúdo, clique no ícone de engrenagem <strong className="text-cyan-400 font-semibold">(⚙️)</strong> no topo para escolher os seus tópicos de interesse.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium">{items.length} notícias encontradas</p>
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/45">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
                <h2 className="text-base font-bold mt-2 leading-snug">{item.title}</h2>
                <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{cleanSummary(item.summary)}</p>
                <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center">
                  <span className="text-[11px] text-gray-500 font-medium">{item.source}</span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Ler matéria completa ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 relative text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold p-2"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold mb-1">Configurações</h2>
            <p className="text-xs text-gray-400 mb-6">Personalize os seus tópicos e alertas de notícias.</p>

            {successMessage && (
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl leading-relaxed">
                {successMessage}
              </div>
            )}

            <div className="mb-6 space-y-4">
              <label className="text-sm font-semibold text-cyan-400">Gerir Tópicos</label>
              
              <div className="space-y-1.5">
                <span className="text-[11px] text-gray-400">Escolha um tópico para adicionar:</span>
                <div className="flex gap-2">
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="flex-1 bg-gray-800 text-white px-3 py-2.5 rounded-xl border border-gray-700 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Selecionar tópico --</option>
                    {PRESET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddTopic}
                    disabled={!selectedPreset}
                    className={`font-bold px-4 py-2 rounded-xl text-sm transition-colors ${
                      selectedPreset ? "bg-cyan-500 text-black hover:bg-cyan-400" : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-gray-400 block mb-1.5">Os seus tópicos ativos:</span>
                <div className="flex flex-wrap gap-2">
                  {topics.length === 0 ? (
                    <span className="text-xs text-gray-500">Nenhum tópico selecionado.</span>
                  ) : (
                    topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-full border border-gray-700 flex items-center gap-2"
                      >
                        {t}
                        <button
                          onClick={() => handleRemoveTopic(t)}
                          className="text-gray-400 hover:text-red-400 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-800 my-4" />

            <div className="space-y-4">
              <label className="text-sm font-semibold text-cyan-400">Notificações</label>
              
              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl border border-gray-800">
                <span className="text-sm">Quero receber alertas</span>
                <button
                  onClick={handleToggleNotifications}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    notificationsEnabled ? "bg-cyan-500 justify-end" : "bg-gray-700 justify-start"
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                </button>
              </div>

              <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl border border-gray-800">
                <span className="text-sm">Horário do resumo</span>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => {
                    setNotificationTime(e.target.value);
                    localStorage.setItem("notifs_time", e.target.value);
                  }}
                  className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full mt-6 bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              Salvar e Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
