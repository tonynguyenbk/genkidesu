import { useMemo } from 'react';
import { Stack, usePathname } from 'expo-router';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { trpc, trpcClient, queryClient } from '../lib/trpc';
import { WebSidebar } from '../components/WebSidebar';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { theme, colorScheme } = useAppTheme();

  const isAuthScreen = pathname.includes('login') || pathname.includes('otp');
  // Show sidebar only on web AND wide screen (≥768px)
  const showSidebar = Platform.OS === 'web' && width >= 768 && !isAuthScreen;

  const navTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.error,
      },
    };
  }, [theme, colorScheme]);

  const content = showSidebar ? (
    <View style={[styles.webLayout, { backgroundColor: theme.colors.background }]}>
      <WebSidebar />
      <View style={[styles.webContent, { backgroundColor: theme.colors.background }]}>{children}</View>
    </View>
  ) : (
    <>{children}</>
  );

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {content}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppShell>
            <Stack screenOptions={{ headerShown: false }} />
          </AppShell>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  webLayout: { flex: 1, flexDirection: 'row', height: '100%' as any },
  webContent: { flex: 1, overflow: 'hidden' as any },
});
