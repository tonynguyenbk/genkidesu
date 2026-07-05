import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { queryClient } from '../lib/trpc';

// In Expo Go, always start from the login screen: drop any persisted session
// once per app launch (module-level flag survives re-mounts but not restarts).
// Standalone/production builds keep the remembered session as normal.
const isExpoGo = Constants.appOwnership === 'expo';
let expoGoSessionCleared = false;

const ACCESS_KEY = 'genki_access_token';
const REFRESH_KEY = 'genki_refresh_token';

const storage = Platform.OS === 'web'
  ? {
      get: (k: string) => Promise.resolve(localStorage.getItem(k)),
      set: (k: string, v: string) => { localStorage.setItem(k, v); return Promise.resolve(); },
      delete: (k: string) => { localStorage.removeItem(k); return Promise.resolve(); },
    }
  : {
      get: (k: string) => SecureStore.getItemAsync(k),
      set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
      delete: (k: string) => SecureStore.deleteItemAsync(k),
    };

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (isExpoGo && !expoGoSessionCleared) {
        expoGoSessionCleared = true;
        await Promise.all([storage.delete(ACCESS_KEY), storage.delete(REFRESH_KEY)]);
      }
      const t = await storage.get(ACCESS_KEY);
      setToken(t ?? null);
      setLoading(false);
    })();
  }, []);

  const saveToken = useCallback(async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      storage.set(ACCESS_KEY, accessToken),
      storage.set(REFRESH_KEY, refreshToken),
    ]);
    setToken(accessToken);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      storage.delete(ACCESS_KEY),
      storage.delete(REFRESH_KEY),
    ]);
    // Drop all cached server data so the next login doesn't see the
    // previous account's meals/stats from the in-memory query cache.
    queryClient.clear();
    setToken(null);
    router.replace('/(auth)/login');
  }, [router]);

  const getToken = useCallback(() => storage.get(ACCESS_KEY), []);

  return { token, loading, saveToken, logout, getToken };
}
