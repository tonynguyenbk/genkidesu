import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';

const ACTIVE_PROFILE_KEY = 'genki_active_profile_id';
const ACTIVE_PROFILE_QUERY_KEY = ['activeProfileId'];

const storage = Platform.OS === 'web'
  ? {
      get: (k: string) => Promise.resolve(localStorage.getItem(k)),
      set: (k: string, v: string) => { localStorage.setItem(k, v); return Promise.resolve(); },
    }
  : {
      get: (k: string) => SecureStore.getItemAsync(k),
      set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    };

// Tracks which family-member profile is "active" on this device. The backend
// has no concept of a per-session active profile, so the choice is persisted
// locally and falls back to the oldest profile (the account owner) when unset.
// Backed by the shared QueryClient cache so every component sees the same
// selection — plain useState would give each caller its own copy.
export function useActiveProfile() {
  const queryClient = useQueryClient();
  const profiles = trpc.profile.list.useQuery(undefined, { retry: false, staleTime: 60_000 });

  const { data: activeId } = useQuery({
    queryKey: ACTIVE_PROFILE_QUERY_KEY,
    queryFn: () => storage.get(ACTIVE_PROFILE_KEY),
    staleTime: Infinity,
  });

  const setActiveProfile = useCallback((id: string) => {
    queryClient.setQueryData(ACTIVE_PROFILE_QUERY_KEY, id);
    storage.set(ACTIVE_PROFILE_KEY, id);
  }, [queryClient]);

  const list = profiles.data ?? [];
  const activeProfile = list.find((p) => p.id === activeId) ?? list[0] ?? null;

  return { activeProfile, setActiveProfile, profiles: list, isLoading: profiles.isLoading };
}
