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

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('genki_access_token');
  return SecureStore.getItemAsync('genki_access_token');
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:4000'}/trpc`,
      async headers() {
        const token = await getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
