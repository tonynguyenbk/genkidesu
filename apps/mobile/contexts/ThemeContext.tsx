import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform, useColorScheme, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getTheme, type Theme, type ColorScheme } from '@genki/ui';
import { useProfileTheme } from '../hooks/useProfileTheme';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'genki_theme_preference';

const storage = Platform.OS === 'web'
  ? {
      get: (k: string) => Promise.resolve(localStorage.getItem(k)),
      set: (k: string, v: string) => { localStorage.setItem(k, v); return Promise.resolve(); },
    }
  : {
      get: (k: string) => SecureStore.getItemAsync(k),
      set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    };

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { profileType } = useProfileTheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    storage.get(THEME_PREFERENCE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPreferenceState(value);
      }
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    storage.set(THEME_PREFERENCE_KEY, next);
  }, []);

  const colorScheme: ColorScheme = preference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : preference;

  const theme = useMemo(() => getTheme(profileType, colorScheme), [profileType, colorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colorScheme, preference, setPreference }),
    [theme, colorScheme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}

// Builds a StyleSheet from the current theme, memoized so styles are only
// recomputed when the theme (persona or light/dark) actually changes.
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T
): T {
  const { theme } = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
