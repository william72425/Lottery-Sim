// lib/settings.ts

export interface AppSettings {
  depositLimitEnabled: boolean;
}

const SETTINGS_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  depositLimitEnabled: true,
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return defaultSettings;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultSettings;
  }
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleDepositLimit(enabled: boolean): AppSettings {
  return updateSettings({ depositLimitEnabled: enabled });
}

export function isDepositLimitEnabled(): boolean {
  return getSettings().depositLimitEnabled;
}
