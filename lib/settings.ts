export interface AppSettings {
  depositLimitEnabled: boolean;
}

const SETTINGS_KEY = 'app_settings';
const defaultSettings: AppSettings = { depositLimitEnabled: true };

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : defaultSettings;
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const updated = { ...getSettings(), ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function isDepositLimitEnabled(): boolean {
  return getSettings().depositLimitEnabled;
}
