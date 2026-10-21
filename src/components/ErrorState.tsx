import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.04] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="mb-1 text-[15px] font-semibold text-white">
        Não foi possível carregar as notícias
      </h3>
      <p className="mb-5 max-w-xs text-[13px] leading-relaxed text-gray-400">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.1]"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
}
