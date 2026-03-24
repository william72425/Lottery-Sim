// Theme types
export type ThemeType = 'dark' | 'red' | 'cyberpunk' | 'nature';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    foreground: string;
    foregroundMuted: string;
    primary: string;
    primaryHover: string;
    accent: string;
    accentHover: string;
    success: string;
    danger: string;
    warning: string;
    border: string;
    cardBg: string;
    cardBorder: string;
  };
}

// Theme definitions
export const THEMES: Record<ThemeType, ThemeConfig> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Classic dark theme - easy on the eyes',
    colors: {
      background: '#090b0d',
      backgroundSecondary: '#0f1215',
      foreground: '#ffffff',
      foregroundMuted: '#888888',
      primary: '#ffc107',
      primaryHover: '#e6ac00',
      accent: '#ffc107',
      accentHover: '#e6ac00',
      success: '#00c853',
      danger: '#ff3d00',
      warning: '#ff9800',
      border: '#222222',
      cardBg: '#1e2329',
      cardBorder: '#222222',
    },
  },
  red: {
    id: 'red',
    name: 'Red Theme',
    description: 'Bold and passionate red tones',
    colors: {
      background: '#1a0a0a',
      backgroundSecondary: '#241010',
      foreground: '#ffffff',
      foregroundMuted: '#b89a9a',
      primary: '#ff4444',
      primaryHover: '#e63e3e',
      accent: '#ff4444',
      accentHover: '#e63e3e',
      success: '#4caf50',
      danger: '#ff6b6b',
      warning: '#ffa726',
      border: '#442222',
      cardBg: '#2a1414',
      cardBorder: '#442222',
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon lights, vibrant purples and cyans',
    colors: {
      background: '#0a0a1a',
      backgroundSecondary: '#12122a',
      foreground: '#00ffff',
      foregroundMuted: '#8888aa',
      primary: '#ff00ff',
      primaryHover: '#e600e6',
      accent: '#00ffff',
      accentHover: '#00e6e6',
      success: '#00ffaa',
      danger: '#ff3366',
      warning: '#ffaa33',
      border: '#333355',
      cardBg: '#1a1a2e',
      cardBorder: '#333355',
    },
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones, greens and browns',
    colors: {
      background: '#1a2a1a',
      backgroundSecondary: '#223322',
      foreground: '#e8f0e8',
      foregroundMuted: '#a8c0a8',
      primary: '#6b8c42',
      primaryHover: '#5a7a38',
      accent: '#8b5a2b',
      accentHover: '#7a4a1a',
      success: '#4caf50',
      danger: '#d9534f',
      warning: '#f0ad4e',
      border: '#3a553a',
      cardBg: '#2a3a2a',
      cardBorder: '#3a553a',
    },
  },
};

// Get current theme from localStorage
export function getCurrentTheme(): ThemeType {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('app_theme') as ThemeType;
  return saved && THEMES[saved] ? saved : 'dark';
}

// Set theme and apply to document
export function setTheme(theme: ThemeType): void {
  if (typeof window === 'undefined') return;
  
  // Save to localStorage
  localStorage.setItem('app_theme', theme);
  
  // Apply CSS variables to document root
  const config = THEMES[theme];
  const root = document.documentElement;
  
  // Apply colors as CSS custom properties
  root.style.setProperty('--theme-bg', config.colors.background);
  root.style.setProperty('--theme-bg-secondary', config.colors.backgroundSecondary);
  root.style.setProperty('--theme-fg', config.colors.foreground);
  root.style.setProperty('--theme-fg-muted', config.colors.foregroundMuted);
  root.style.setProperty('--theme-primary', config.colors.primary);
  root.style.setProperty('--theme-primary-hover', config.colors.primaryHover);
  root.style.setProperty('--theme-accent', config.colors.accent);
  root.style.setProperty('--theme-accent-hover', config.colors.accentHover);
  root.style.setProperty('--theme-success', config.colors.success);
  root.style.setProperty('--theme-danger', config.colors.danger);
  root.style.setProperty('--theme-warning', config.colors.warning);
  root.style.setProperty('--theme-border', config.colors.border);
  root.style.setProperty('--theme-card-bg', config.colors.cardBg);
  root.style.setProperty('--theme-card-border', config.colors.cardBorder);
}

// Apply theme on page load
export function applySavedTheme(): void {
  const saved = getCurrentTheme();
  setTheme(saved);
      }
