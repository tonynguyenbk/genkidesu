import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '@genki/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

// Shared QueryClient — import this to invalidate queries from anywhere
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const ACCESS_KEY = 'genki_access_token';
const REFRESH_KEY = 'genki_refresh_token';

const storageGet = async (key: string) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};

const storageSet = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getToken = () => storageGet(ACCESS_KEY);

// Access tokens expire after 15 minutes — on a 401, exchange the refresh token
// for a new pair and retry the request once. Deduped so parallel 401s don't
// race each other (the server rotates the session on every refresh).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const refreshToken = await storageGet(REFRESH_KEY);
      if (!refreshToken) return null;
      const res = await fetch(`${API_URL}/trpc/auth.refresh?batch=1`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ '0': { refreshToken } }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Array<{
        result?: { data?: { accessToken?: string; refreshToken?: string } };
      }>;
      const tokens = data?.[0]?.result?.data;
      if (!tokens?.accessToken || !tokens.refreshToken) return null;
      await storageSet(ACCESS_KEY, tokens.accessToken);
      await storageSet(REFRESH_KEY, tokens.refreshToken);
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      maxURLLength: 2048,
      async headers() {
        const token = await getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      async fetch(url, options) {
        const res = await fetch(url as RequestInfo, options as RequestInit);
        if (res.status !== 401) return res;
        const newToken = await refreshAccessToken();
        if (!newToken) return res;
        const headers = new Headers((options as RequestInit | undefined)?.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(url as RequestInfo, { ...(options as RequestInit), headers });
      },
    }),
  ],
});
