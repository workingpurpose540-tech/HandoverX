import { createContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const THEME_STORAGE_KEY = 'handoverx_theme';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

