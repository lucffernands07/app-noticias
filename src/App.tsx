import React, { useState, useEffect } from "react";
import { fetchNews } from "./lib/api";
import type { NewsItem } from "./types";

export function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["geral"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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
          className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 text-gray-300"
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

      {/* Modal de Configurações Simples */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 relative text-white">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-2">Configurações de Temas</h2>
            <p className="text-xs text-gray-400 mb-4">
              Os temas exibidos são atualizados automaticamente a cada execução do GitHub Actions.
            </p>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-cyan-500 text-black font-bold py-2.5 rounded-xl hover:bg-cyan-400 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
