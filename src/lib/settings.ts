import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, type Category } from "@/types";

export type Frequency = "diario" | "urgentes";

export type NotificationSettings = {
  pushEnabled: boolean;
  // Categories the user wants alerts for. "geral" is excluded from selection
  // since it is an aggregate — only real topic categories are selectable.
  alertCategories: Category[];
  alertTime: string; // "HH:MM" 24h format
  frequency: Frequency;
  // ISO timestamp of the last delivered summary, used to avoid duplicates.
  lastNotifiedAt: string | null;
};

const STORAGE_KEY = "noticias-hoje:settings";

export const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  alertCategories: [],
  alertTime: "08:00",
  frequency: "diario",
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
  const togglePush =
    
