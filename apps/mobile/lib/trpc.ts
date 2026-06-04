import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@genki/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

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
