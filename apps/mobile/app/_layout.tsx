import { Stack, usePathname } from 'expo-router';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '../lib/trpc';
import { WebSidebar } from '../components/WebSidebar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isAuthScreen = pathname.includes('login') || pathname.includes('otp');
  // Show sidebar only on web AND wide screen (≥768px)
  const showSidebar = Platform.OS === 'web' && width >= 768 && !isAuthScreen;

  if (showSidebar) {
    return (
      <View style={styles.webLayout}>
        <WebSidebar />
        <View style={styles.webContent}>{children}</View>
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <Stack screenOptions={{ headerShown: false }} />
        </AppShell>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  webLayout: { flex: 1, flexDirection: 'row', height: '100%' as any },
  webContent: { flex: 1, overflow: 'hidden' as any },
});
