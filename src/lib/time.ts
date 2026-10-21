// Relative time formatting in pt-BR (e.g. "há 1h", "há 3 min", "há 2 dias").
export function timeAgo(iso: string | null): string {
  if (!iso) return "Data indisponível";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "Data indisponível";

  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  if (hr < 24) return `há ${hr}h`;
  if (day === 1) return "ontem";
  if (day < 7) return `há ${day} dias`;
  // Beyond a week, show the short date.
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
