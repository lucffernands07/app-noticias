import { Bookmark, X } from "lucide-react";
import type { NewsItem } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { googleSearchUrl } from "@/lib/api";
import { timeAgo } from "@/lib/time";

type Props = {
  open: boolean;
  favorites: NewsItem[];
  onClose: () => void;
  onRemove: (item: NewsItem) => void;
};

export function FavoritesDrawer({ open, favorites, onClose, onRemove }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#0c0c0e] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Notícias salvas"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-cyan-300" />
            <h2 className="text-[15px] font-semibold text-white">
              Ver depois ({favorites.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/5">
                <Bookmark className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-[13px] text-gray-500">
                Nenhuma notícia salva ainda.
                <br />
                Toque em "Ver depois" para guardar aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {favorites.map((item) => {
                const href =
                  item.link && /^https?:\/\//.test(item.link)
                    ? item.link
                    : googleSearchUrl(item.title);
                return (
                  <li
                    key={item.link}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-300">
                        {CATEGORY_LABELS[item.category] || "Notícia"}
                      </span>
                      <span className="text-[10.5px] text-gray-500">
                        {timeAgo(item.publishedAt)} · {item.source}
                      </span>
                    </div>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[13.5px] font-medium leading-snug text-gray-100 hover:text-cyan-300"
                    >
                      {item.title}
                    </a>
                    <button
                      onClick={() => onRemove(item)}
                      className="mt-2 text-[11px] font-medium text-gray-500 transition-colors hover:text-red-400"
                    >
                      Remover
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
