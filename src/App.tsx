import React, { useState, useEffect, useRef } from "react";
import { fetchNews } from "./lib/api";
import type { NewsItem } from "./types";

export function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["geral"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationTime, setNotificationTime] = useState<string>("08:00");

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sugestões predefinidas para o utilizador escolher rapidamente com um clique
  const PRESET_SUGGESTIONS = [
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
    if (savedNotifs) setNotificationsEnabled(JSON.parse(savedNotifs));

    const savedTime = localStorage.getItem("notifs_time");
    if (savedTime) setNotificationTime(savedTime);
  }, []);

  useEffect(() => {
    const activeTopics = ["geral", ...topics.map(t => t.toLowerCase())];
    setCategories(activeTopics);

    if (!activeTopics.includes(selectedCategory.toLowerCase())) {
      setSelectedCategory("geral");
    }
  }, [topics]);

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

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return "";
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const handleAddTopic = (topicToAdd?: string) => {
    const target = topicToAdd || newTopic;
    if (!target.trim()) return;
    const formatted = capitalizeFirstLetter(target);
    
    if (topics.map(t => t.toLowerCase()).includes(formatted.toLowerCase())) return;

    const updated = [...topics, formatted];
    setTopics(updated);
    localStorage.setItem("user_custom_topics", JSON.stringify(updated));
    if (!topicToAdd) setNewTopic("");

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
      const currentIndex = categories.indexOf(selectedCategory.toLowerCase());
      if (distance > 0) {
        const nextIndex = (currentIndex + 1) % categories.length;
        setSelectedCategory(categories[nextIndex]);
      } else {
        const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
        setSelectedCategory(categories[prevIndex]);
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

      <nav className="flex gap-2 overflow-x-auto py-3 px-4 border-b border-gray-800/50 max-w-3xl w-full mx-auto scrollbar-none touch-pan-x [-webkit-overflow-scrolling:touch]">
        {categories.map((cat) => (
          <button
            key={cat}
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
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/45">
                  {item.category}
                </span>
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

            <div className="mb-6 space-y-3">
              <label className="text-sm font-semibold text-cyan-400">Gerir Tópicos Manuais</label>
              
              {/* Caixa de opções / Sugestões rápidas para escolha */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-gray-400">Escolha rápida de tópicos populares:</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-950/40 border border-gray-800 rounded-xl">
                  {PRESET_SUGGESTIONS.map((suggestion) => {
                    const isSelected = topics.map(t => t.toLowerCase()).includes(suggestion.toLowerCase());
                    return (
                      <button
                        key={suggestion}
                        onClick={() => !isSelected && handleAddTopic(suggestion)}
                        disabled={isSelected}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected 
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 opacity-60 cursor-not-allowed" 
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500 hover:text-white"
                        }`}
                      >
                        {isSelected ? `✓ ${suggestion}` : `+ ${suggestion}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campo livre para digitar qualquer outro tópico */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ou digite outro tópico personalizado..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-xl border border-gray-700 text-sm outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleAddTopic()}
                  className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-cyan-400 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Tópicos atualmente ativos do utilizador */}
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
            
