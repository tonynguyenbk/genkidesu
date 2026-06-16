import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { useAuth } from '../../hooks/useAuth';
import { trpc } from '../../lib/trpc';
import { useNotifications } from '../../hooks/useNotifications';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles, type ThemePreference } from '../../contexts/ThemeContext';

const TYPE_COLORS: Record<string, string> = {
  adult: '#2ECC71', senior: '#F59E0B', teen: '#8B5CF6', baby: '#EC4899',
};

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Theo hệ thống', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Sáng', icon: 'sunny-outline' },
  { key: 'dark', label: 'Tối', icon: 'moon-outline' },
];

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Hệ thống',
  light: 'Sáng',
  dark: 'Tối',
};

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? theme.colors.error : theme.colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: theme.colors.error }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {!danger && <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );
}

function calcBMI(weightKg: number | null, heightCm: number | null): string {
  if (!weightKg || !heightCm) return '–';
  const bmi = weightKg / ((heightCm / 100) ** 2);
  return bmi.toFixed(1);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, preference, setPreference } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const { activeProfile: profile, isLoading: profileLoading } = useActiveProfile();
  const subscription = trpc.subscription.getStatus.useQuery(undefined, { retry: false });
  const { sendTestNotification, permission } = useNotifications();

  const currentPlan = subscription.data?.plan ?? 'free';
  const isFreePlan = currentPlan === 'free';

  const color = TYPE_COLORS[profile?.type ?? 'adult'] ?? '#2ECC71';
  const initial = profile?.name?.[0]?.toUpperCase() ?? 'G';
  const tdee = profile?.tdeeKcal ? Math.round(profile.tdeeKcal) : null;
  const bmi = calcBMI(profile?.weightKg ?? null, profile?.heightCm ?? null);
  const goal = (profile?.nutritionTargets as any)?.calories;

  const activityLabels = ['', 'Ít vận động', 'Vận động nhẹ', 'Vận động vừa', 'Vận động nhiều', 'Rất nhiều'];
  const activityLabel = activityLabels[profile?.activityLevel ?? 2] ?? '';

  const displayName = me.data?.email ?? me.data?.phone ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.hero}>
          {profileLoading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <>
              <View style={[styles.avatarBig, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.name}>{profile?.name ?? 'Hồ sơ'}</Text>
              {displayName ? <Text style={styles.email}>{displayName}</Text> : null}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {profile?.type === 'adult' ? '👤 Người lớn'
                      : profile?.type === 'senior' ? '👴 Cao tuổi'
                      : profile?.type === 'teen' ? '🧑 Thiếu niên'
                      : profile?.type === 'baby' ? '👶 Em bé'
                      : '👤 Người lớn'}
                  </Text>
                </View>
                {activityLabel && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>🏃 {activityLabel}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'TDEE', value: tdee ? tdee.toLocaleString() : '–', unit: 'kcal' },
            { label: 'BMI', value: bmi, unit: '' },
            { label: 'Mục tiêu', value: goal ? goal.toLocaleString() : '–', unit: 'kcal' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>
                {s.value}
                {s.unit ? <Text style={styles.statUnit}> {s.unit}</Text> : null}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade banner (free plan only) */}
        {isFreePlan && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/paywall' as any)}>
            <View>
              <Text style={styles.upgradeTitle}>✨ Nâng cấp lên Pro</Text>
              <Text style={styles.upgradeSub}>Không giới hạn ảnh · AI tư vấn · 15+ vi chất</Text>
            </View>
            <View style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>59k/tháng →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hồ sơ</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Thông tin cá nhân"
              value={profile?.weightKg ? `${profile.weightKg}kg` : undefined}
              onPress={() => router.push('/profile/edit' as any)}
            />
            <MenuItem
              icon="fitness-outline"
              label="Mục tiêu dinh dưỡng"
              value={goal ? `${goal.toLocaleString()} kcal` : undefined}
              onPress={() => router.push('/profile/edit' as any)}
            />
            <MenuItem icon="medical-outline" label="Bệnh lý & Chế độ ăn" onPress={() => router.push('/profile/health' as any)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="color-palette-outline"
              label="Giao diện"
              value={THEME_LABELS[preference]}
              onPress={() => setThemeModalVisible(true)}
            />
            <MenuItem
              icon="notifications-outline"
              label="Thông báo"
              value={permission === 'granted' ? 'Bật' : 'Tắt'}
              onPress={sendTestNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gói dịch vụ</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="flash-outline"
              label="Gói hiện tại"
              value={currentPlan === 'free' ? 'Miễn phí' : currentPlan === 'pro' ? 'Pro ✓' : 'Gia đình ✓'}
              onPress={() => router.push('/paywall' as any)}
            />
            {isFreePlan && (
              <MenuItem
                icon="star-outline"
                label="Nâng cấp Pro"
                value="59.000đ/tháng"
                onPress={() => router.push('/paywall' as any)}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gia đình</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="people-outline" label="Quản lý gia đình" onPress={() => router.push('/(tabs)/family')} />
            <MenuItem icon="add-circle-outline" label="Tạo hồ sơ mới" onPress={() => router.push('/profile/create')} />
          </View>
        </View>

        <View style={[styles.menuCard, { marginHorizontal: 16, marginBottom: 32 }]}>
          <MenuItem icon="log-out-outline" label="Đăng xuất" danger onPress={logout} />
        </View>
      </ScrollView>

      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setThemeModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Giao diện</Text>
            {THEME_OPTIONS.map((opt) => {
              const selected = preference === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.modalOption, selected && { backgroundColor: theme.colors.surfaceAlt }]}
                  onPress={() => {
                    setPreference(opt.key);
                    setThemeModalVisible(false);
                  }}
                >
                  <View style={styles.modalOptionLeft}>
                    <Ionicons name={opt.icon} size={20} color={selected ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[styles.modalOptionLabel, selected && { color: theme.colors.primary }]}>{opt.label}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    hero: {
      alignItems: 'center', paddingTop: Platform.OS === 'web' ? 32 : 16,
      paddingBottom: 24, paddingHorizontal: 20, minHeight: 160,
    },
    avatarBig: {
      width: 84, height: 84, borderRadius: 42,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 12, shadowColor: theme.colors.shadow, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
    name: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    email: { fontSize: 13, color: theme.colors.textTertiary, marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
    badge: {
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
      backgroundColor: theme.colors.surfaceAlt,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    statsRow: {
      flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 20,
      borderRadius: 16, padding: 16,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
    statUnit: { fontSize: 11, color: theme.colors.textTertiary, fontWeight: '400' },
    statLabel: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    section: { paddingHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textTertiary, marginBottom: 8, paddingLeft: 4 },
    menuCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden',
      shadowColor: theme.colors.shadow, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    menuIcon: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
    },
    menuIconDanger: { backgroundColor: theme.colors.errorBg },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text },
    menuValue: { fontSize: 13, color: theme.colors.textTertiary },
    upgradeBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceAlt, borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
      padding: 16, borderWidth: 1.5, borderColor: theme.colors.primary,
    },
    upgradeTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    upgradeSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    upgradeBtn: {
      backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    modalOverlay: {
      flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, paddingBottom: Platform.OS === 'web' ? 20 : 36,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, textAlign: 'center' },
    modalOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12,
    },
    modalOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalOptionLabel: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  });
}
