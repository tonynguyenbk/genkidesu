import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { Theme } from '@genki/ui';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

export default function Index() {
  const { token, loading } = useAuth();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surfaceAlt },
  });
}
