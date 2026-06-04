import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const ACCESS_TOKEN_KEY = 'genki_access_token';
const REFRESH_TOKEN_KEY = 'genki_refresh_token';

function webStorage() {
  return {
    get: (key: string) => Promise.resolve(localStorage.getItem(key)),
    set: (key: string, value: string) => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

const storage = Platform.OS === 'web' ? webStorage() : {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    storage.get(ACCESS_TOKEN_KEY).then((t) => setToken(t ?? null));
  }, []);

  const saveToken = async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      storage.set(ACCESS_TOKEN_KEY, accessToken),
      storage.set(REFRESH_TOKEN_KEY, refreshToken),
    ]);
    setToken(accessToken);
  };

  const logout = async () => {
    await Promise.all([
      storage.delete(ACCESS_TOKEN_KEY),
      storage.delete(REFRESH_TOKEN_KEY),
    ]);
    setToken(null);
    router.replace('/(auth)/login');
  };

  return { token, saveToken, logout };
}
