import { useEffect, useRef } from "react";
import type { Category } from "@/types";
import { sendSummaryNow } from "@/lib/notifications";
import {
  alreadyNotifiedToday,
  isAlertTime,
  type NotificationSettings,
} from "@/lib/settings";

export function useNotificationScheduler(
  settings: NotificationSettings,
  markNotified: () => void
) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!settings.pushEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    if (settings.alertCategories.length === 0) return;

    // Verificação a cada 15 segundos para maior precisão no minuto programado
    const CHECK_INTERVAL = 15_000;

    const check = async () => {
      const s = settingsRef.current;
      if (!s.pushEnabled) return;
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      
      const now = new Date();
      
      // Valida se o horário atual bate com o configurado e se já não foi enviado hoje
      if (!isAlertTime(now, s.alertTime)) return;
      if (alreadyNotifiedToday(s.lastNotifiedAt, now)) return;

      const ok = await sendSummaryNow(
        s.alertCategories as Category[],
        s.frequency
      );
      
      if (ok) {
        markNotified();
      }
    };

    // Executa uma verificação imediata ao montar e depois a cada intervalo
    check();
    const id = setInterval(check, CHECK_INTERVAL);
    
    return () => clearInterval(id);
  }, [
    settings.pushEnabled,
    settings.alertTime,
    settings.frequency,
    settings.alertCategories,
    settings.lastNotifiedAt,
    markNotified,
  ]);
}
