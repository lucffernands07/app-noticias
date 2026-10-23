import { useEffect, useRef } from "react";
import type { Category } from "@/types";
import { sendSummaryNow } from "@/lib/notifications";
import {
  shouldSendNotification,
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

    // Verificação a cada 15 segundos para maior precisão
    const CHECK_INTERVAL = 15_000;

    const check = async () => {
      const s = settingsRef.current;
      if (!s.pushEnabled) return;
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      
      const now = new Date();
      
      // Valida utilizando a nova regra unificada (Diário ou Intervalo de Horas)
      if (!shouldSendNotification(s.lastNotifiedAt, s.alertTime, s.intervalHours, now)) {
        return;
      }

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
    settings.intervalHours,
    settings.alertCategories,
    settings.lastNotifiedAt,
    markNotified,
  ]);
}
