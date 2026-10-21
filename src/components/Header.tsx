import { Newspaper, Settings2 } from "lucide-react";

type Props = {
  favoriteCount: number;
  onOpenSettings: () => void;
};

export function Header({ favoriteCount, onOpenSettings }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0b]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/20">
            <Newspaper className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight text-white">
              Notícias Hoje
            </h1>
            <p className="text-[11px] text-gray-500">
              Tendências do Brasil em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-gray-400 ring-1 ring-white/5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            ao vivo
            {favoriteCount > 0 && (
              <span className="ml-1 text-cyan-300">{favoriteCount} salvas</span>
            )}
          </div>
          <button
            onClick={onOpenSettings}
            aria-label="Configurações de notificações"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-gray-300 ring-1 ring-white/5 transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:ring-cyan-400/30"
          >
            <Settings2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
