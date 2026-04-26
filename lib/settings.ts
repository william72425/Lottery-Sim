// lib/settings.ts

export interface AppSettings {
  depositLimitEnabled: boolean; // If true, max 3 deposits per day; if false, unlimited
}

const SETTINGS_KEY = 'app_settings';

// Default settings
const defaultSettings: AppSettings = {
  depositLimitEnabled: true, // Default: 30-day limit ON
};

// Get all settings
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

// Update settings
export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// Toggle deposit limit
export function toggleDepositLimit(enabled: boolean): AppSettings {
  return updateSettings({ depositLimitEnabled: enabled });
}

// Check if deposit limit is enabled
export function isDepositLimitEnabled(): boolean {
  return getSettings().depositLimitEnabled;
}
