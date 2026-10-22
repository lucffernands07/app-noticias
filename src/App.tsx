import React, { useState, useEffect } from "react";
import { fetchNews } from "./lib/api";
import type { NewsItem } from "./types";

export function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["geral"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Modal de Configurações
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [topics, setTopics] = useState<string[]>(["TI", "Microsoft", "Windows", "IA", "Cloud", "Corinthians", "Política"]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationTime, setNotificationTime] = useState<string>("08:00");

  // Carregar definições salvas no localStorage
  useEffect(() => {
    const savedTopics = localStorage.getItem("user_custom_topics");
    if (savedTopics) {
      try {
        setTopics(JSON.parse(savedTopics));
      } catch (e) {}
    }

    const savedNotifs = localStorage.getItem("notifs_enabled");
    if (savedNotifs) setNotificationsEnabled(JSON.parse(savedNotifs));

    const savedTime = localStorage.getItem("notifs_time");
    if (savedTime) setNotificationTime(savedTime);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const response = await fetchNews(selectedCategory);

      if (response.error) {
        setError(response.error);
      } else {
        setItems(response.items);
        
        if (response.categories && response.categories.length > 0) {
          const uniqueCategories = Array.from(
            new Set(["geral", ...response.categories.map((c) => c.toLowerCase())])
          );
          setCategories(uniqueCategories);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [selectedCategory]);

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    const formatted = newTopic.trim();
    if (topics.includes(formatted)) return;

    const updated = [...topics, formatted];
    setTopics(updated);
    localStorage.setItem("user_custom_topics", JSON.stringify(updated));
    setNewTopic("");
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    const updated = topics.filter(t => t !== topicToRemove);
    setTopics(updated);
    localStorage.setItem("user_custom_topics", JSON.stringify(updated));
  };

  const handleToggleNotifications = () => {
    const nextState = !notificationsEnabled;
    setNotificationsEnabled(nextState);
    localStorage.setItem("notifs_enabled", JSON.stringify(nextState));
    if (nextState && "Notification" in window) {
      Notification.requestPermission();
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setNotificationTime(time);
    localStorage.setItem("notifs_time", time);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
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

      {/* Navegação por Abas Dinâmicas */}
      <nav className="flex gap-2 overflow-x-auto p-4 border-b border-gray-800/50 max-w-3xl w-full mx-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium capitalize text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Conteúdo das Notícias */}
      <main className="p-4 max-w-3xl w-full mx-auto flex-1">
        {loading ? (
          <div className="text-center py-16 text-gray-400 animate-pulse flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Buscando as últimas notícias...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma notícia encontrada para esta categoria.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium">{items.length} notícias encontradas</p>
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                  {item.category}
                </span>
                <h2 className="text-base font-bold mt-2 leading-snug">{item.title}</h2>
                <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{item.summary}</p>
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

      {/* Modal de Configurações Completo */}
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

            {/* Secção de Gestão Manual de Tópicos */}
            <div className="mb-6 space-y-3">
              <label className="text-sm font-semibold text-cyan-400">Gerir Tópicos Manuais</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ex: TI, Windows, Corinthians..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-xl border border-gray-700 text-sm outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddTopic}
                  className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-cyan-400 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {topics.map((t, idx) => (
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
                ))}
              </div>
            </div>

            <hr className="border-gray-800 my-4" />

            {/* Secção de Notificações e Alertas */}
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
                  onChange={handleTimeChange}
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
          
