import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../lib/trpc';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

const TYPE_COLORS: Record<string, string> = {
  adult: '#34C759', senior: '#FF9F0A', teen: '#AF52DE', baby: '#FF2D55',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Miễn phí', pro: 'Pro', family: 'Gia đình',
};

const NAV_ITEMS = [
  { href: '/(tabs)', label: 'Trang chủ', icon: 'home' as const, activeIcon: 'home' as const },
  { href: '/(tabs)/stats', label: 'Thống kê', icon: 'bar-chart-outline' as const, activeIcon: 'bar-chart' as const },
  { href: '/(tabs)/camera', label: 'Chụp ảnh', icon: 'camera-outline' as const, activeIcon: 'camera' as const },
  { href: '/(tabs)/group', label: 'Nhóm', icon: 'people-outline' as const, activeIcon: 'people' as const },
  { href: '/(tabs)/profile', label: 'Hồ sơ', icon: 'person-circle-outline' as const, activeIcon: 'person-circle' as const },
];

export function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { activeProfile: profile } = useActiveProfile();
  const subscription = trpc.subscription.getStatus.useQuery(undefined, { retry: false });

  const avatarColor = TYPE_COLORS[profile?.type ?? 'adult'] ?? '#34C759';
  const initial = profile?.name?.[0]?.toUpperCase() ?? 'G';
  const planLabel = PLAN_LABELS[subscription.data?.plan ?? 'free'] ?? 'Miễn phí';

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logo}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoKanji}>元気</Text>
        </View>
        <Text style={styles.logoText}>Genki</Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === '/(tabs)' && pathname === '/') ||
            (item.href !== '/(tabs)' && pathname.startsWith(item.href.replace('/(tabs)', '')));

          return (
            <TouchableOpacity
              key={item.href}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.profileRow} onPress={() => router.push('/(tabs)/profile')}>
          <View style={[styles.profileAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.profileAvatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{profile?.name ?? 'Hồ sơ'}</Text>
            <Text style={styles.profilePlan}>{planLabel}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    sidebar: {
      width: 220, backgroundColor: theme.colors.surface, height: '100%',
      borderRightWidth: 1, borderRightColor: theme.colors.divider,
      paddingVertical: 24, paddingHorizontal: 16,
      justifyContent: 'space-between',
    },
    logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 },
    logoIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    logoKanji: { fontSize: 16, color: '#fff', fontWeight: '700' },
    logoText: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    nav: { gap: 4 },
    navItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10,
    },
    navItemActive: { backgroundColor: theme.colors.surfaceAlt },
    navLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary },
    navLabelActive: { color: theme.colors.primary, fontWeight: '700' },
    bottom: { borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 16 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    profileAvatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    profileAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    profileName: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    profilePlan: { fontSize: 11, color: theme.colors.textTertiary },
  });
}
