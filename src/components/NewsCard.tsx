import { Bookmark, BookmarkCheck, Clock, ExternalLink, Tag } from "lucide-react";
import type { NewsItem } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { googleSearchUrl } from "@/lib/api";
import { timeAgo } from "@/lib/time";

type Props = {
  item: NewsItem;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (item: NewsItem) => void;
};

export function NewsCard({ item, index, isFavorite, onToggleFavorite }: Props) {
  const categoryLabel = CATEGORY_LABELS[item.category] || "Notícia";
  // The direct portal link. If it's missing/invalid, fall back to a Google
  // News search for the exact title — never construct URLs by hand.
  const primaryUrl =
    item.link && /^https?:\/\//.test(item.link) ? item.link : null;
  const href = primaryUrl ?? googleSearchUrl(item.title);
  const isFallback = !primaryUrl;

  const favoriteLabel = isFavorite ? "Salvo" : "Ver depois";

  return (
    <article
      className="nh-fade-up group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-200 hover:border-white/10 hover:bg-white/[0.035]"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-400/20">
          <Tag className="h-3 w-3" />
          {categoryLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
          <Clock className="h-3 w-3" />
          {timeAgo(item.publishedAt)}
        </span>
      </div>

      <h2 className="mb-2 text-[16px] font-semibold leading-snug tracking-tight text-white">
        {item.title}
      </h2>

      {item.summary && (
        <p className="mb-3.5 line-clamp-3 text-[13px] leading-relaxed text-gray-400">
          {item.summary}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="flex h-6 items-center rounded-md bg-white/[0.05] px-2 font-semibold text-gray-200 ring-1 ring-white/5">
            {item.source}
          </span>
          {isFallback && (
            <span className="text-[10.5px] text-amber-400/80">
              via Google
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleFavorite(item)}
            aria-label={favoriteLabel}
            title={favoriteLabel}
            className={[
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-colors",
              isFavorite
                ? "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/25"
                : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-gray-200",
            ].join(" ")}
          >
            {isFavorite ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{favoriteLabel}</span>
          </button>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-400 px-3.5 text-[12.5px] font-semibold text-[#0a0a0b] transition-all duration-200 hover:bg-cyan-300 hover:shadow-[0_0_24px_-6px_rgba(34,211,238,0.6)]"
          >
            <ExternalLink className="h-4 w-4" />
            Ler matéria completa
          </a>
        </div>
      </div>
    </article>
  );
}
