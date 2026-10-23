import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, type Category } from "@/types";

export type Frequency = "diario" | "urgentes";

export type NotificationSettings = {
  pushEnabled: boolean;
  // Categories the user wants alerts for. "geral" is excluded from selection
  // since it is an aggregate — only real topic categories are selectable.
  alertCategories: Category[];
  alertTime: string; // "HH:MM" 24h format (Horário inicial)
  frequency: Frequency;
  intervalHours: number | null; // null = a cada 24h (diário), ou número de 1 a 12
  // ISO timestamp of the last delivered summary, used to avoid duplicates.
  lastNotifiedAt: string | null;
};

const STORAGE_KEY = "noticias-hoje:settings";

export const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  alertCategories: [],
  alertTime: "08:00",
  frequency: "diario",
  intervalHours: null, // Padrão desativado (24h/diário)
  lastNotifiedAt: null,
};

// Categories selectable for alerts (excludes the aggregate "geral" tab).
export const ALERT_CATEGORIES = CATEGORIES.filter((c) => c.id !== "geral");

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(load());
  }, []);

  const persist = useCallback((next: NotificationSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const update = useCallback(
    (patch: Partial<NotificationSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota errors */
        }
        return next;
      });
    },
    []
  );

  // Toggle the user's intent to receive alerts.
  const togglePush = useCallback(
    (enabled: boolean) => {
      update({ pushEnabled: enabled });
    },
    [update]
  );

  // Request browser notification permission explicitly.
  const requestPermission = useCallback(async (): Promise<
    NotificationPermission | "unsupported"
  > => {
    if (!("Notification" in window)) return "unsupported";

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        update({ pushEnabled: true });
      } else {
        update({ pushEnabled: false });
      }

      return permission;
    } catch {
      return Notification.permission || "unsupported";
    }
  }, [update]);

  const toggleCategory = useCallback(
    (cat: Category) => {
      setSettings((prev) => {
        const exists = prev.alertCategories.includes(cat);
        const alertCategories = exists
          ? prev.alertCategories.filter((c) => c !== cat)
          : [...prev.alertCategories, cat];
        const next = { ...prev, alertCategories };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    []
  );

  // Mark that a summary notification was just delivered.
  const markNotified = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, lastNotifiedAt: new Date().toISOString() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Reseta o contador do último envio para permitir testes imediatos
  const resetNotificationTimer = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, lastNotifiedAt: null };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return {
    settings,
    update,
    togglePush,
    requestPermission,
    toggleCategory,
    markNotified,
    resetNotificationTimer,
    persist,
  };
}

// Whether the current time matches the configured alert time (within the same minute).
export function isAlertTime(now: Date, alertTime: string): boolean {
  const [h, m] = alertTime.split(":").map((n) => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return false;
  return now.getHours() === h && now.getMinutes() === m;
}

// Retorna true se a notificação já foi enviada hoje (para o modo 24h/diário)
export function alreadyNotifiedToday(
  lastNotifiedAt: string | null,
  now: Date
): boolean {
  if (!lastNotifiedAt) return false;
  const last = new Date(lastNotifiedAt);
  if (isNaN(last.getTime())) return false;
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

// Valida se já passou o tempo necessário para o próximo envio com base no intervalo ou no modo diário
export function shouldSendNotification(
  lastNotifiedAt: string | null,
  alertTime: string,
  intervalHours: number | null,
  now: Date
): boolean {
  // Se nunca foi notificado, verifica se bateu no horário inicial configurado
  if (!lastNotifiedAt) {
    return isAlertTime(now, alertTime);
  }

  const last = new Date(lastNotifiedAt);
  if (isNaN(last.getTime())) return isAlertTime(now, alertTime);

  // Se o intervalo estiver desativado (null), usa a regra de 24h (diário no alertTime)
  if (!intervalHours) {
    if (alreadyNotifiedToday(lastNotifiedAt, now)) return false;
    return isAlertTime(now, alertTime);
  }

  // Se o intervalo estiver ativo (ex: a cada 2h), calcula se já passou o tempo desde o último envio
  const diffMs = now.getTime() - last.getTime();
  const intervalMs = intervalHours * 60 * 60 * 1000;

  return diffMs >= intervalMs;
}
