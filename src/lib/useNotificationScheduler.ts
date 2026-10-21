import { useEffect, useRef } from "react";
import type { Category } from "@/types";
import { sendSummaryNow } from "@/lib/notifications";
import {
  alreadyNotifiedToday,
  isAlertTime,
  type NotificationSettings,
} from "@/lib/settings";

// Background scheduler: checks every 30s whether the current time matches the
// configured alert time. When it does, fetches news for the selected alert
// categories and fires a native system notification via the service worker.
// Deduplicates within the same day so we never notify twice for the same slot.
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

    const CHECK_INTERVAL = 30_000;

    const check = async () => {
      const s = settingsRef.current;
      if (!s.pushEnabled) return;
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      const now = new Date();
      if (!isAlertTime(now, s.alertTime)) return;
      if (alreadyNotifiedToday(s.lastNotifiedAt, now)) return;

      const ok = await sendSummaryNow(
        s.alertCategories as Category[],
        s.frequency
      );
      if (ok) markNotified();
    };

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
