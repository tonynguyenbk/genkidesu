import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { SummaryBand } from '../../components/group/SummaryBand';
import { AlertBanner } from '../../components/group/AlertBanner';
import { MemberCard, type DashboardMember } from '../../components/group/MemberCard';
import { Leaderboard } from '../../components/group/Leaderboard';

const TODAY_ISO = new Date().toISOString();

export default function GroupScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const families = trpc.family.list.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const groups = families.data ?? [];
  const group = groups.find((g) => g.id === selectedGroupId) ?? groups[0];
  const groupId = group?.id;
  const isCommunity = group?.type === 'community';

  // Family template → per-member nutrition dashboard
  const dashboard = trpc.family.groupDashboard.useQuery(
    { familyId: groupId ?? '', date: TODAY_ISO },
    { enabled: !!groupId && !isCommunity, retry: false },
  );
  // Community template → effort-based streak leaderboard
  const leaderboard = trpc.family.leaderboard.useQuery(
    { familyId: groupId ?? '' },
    { enabled: !!groupId && isCommunity, retry: false },
  );

  useFocusEffect(
    useCallback(() => {
      if (!groupId) return;
      if (isCommunity) void leaderboard.refetch();
      else void dashboard.refetch();
    }, [groupId, isCommunity]),
  );

  // No group yet → create / join prompt
  if (!families.isLoading && !groupId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyGlyph}>
            <Ionicons name="people-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có nhóm</Text>
          <Text style={styles.emptySub}>
            Tạo nhóm gia đình để ăn chung mâm cơm, hoặc cộng đồng để thi đua cùng bạn bè
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/family/create')}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Tạo nhóm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/family/join')}>
            <Text style={styles.joinBtnText}>Tham gia bằng mã mời</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const data = dashboard.data;
  const alerts = (data?.members ?? []).filter((m) => m.status !== 'ok');
  const isLoading = isCommunity ? leaderboard.isLoading : dashboard.isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Large-title header (HIG): screen name big, group context as subtitle */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>Nhóm</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {group?.name ?? ''} · {group?.members.length ?? 0} thành viên
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/family')}>
            <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* iOS segmented control — switch between the user's groups */}
        {groups.length > 1 && (
          <View style={styles.segmented}>
            {groups.map((g) => {
              const active = g.id === (groupId ?? '');
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setSelectedGroupId(g.id)}
                >
                  <Text
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : isCommunity ? (
          /* ── Community: streak leaderboard ── */
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bảng xếp hạng tuần</Text>
              <Leaderboard entries={leaderboard.data?.entries ?? []} />
            </View>
            <Text style={styles.privacyNote}>
              Xếp hạng theo chuỗi ngày ghi log và số ngày đạt mục tiêu — chi tiết bữa ăn của bạn luôn riêng tư.
            </Text>
          </>
        ) : (
          /* ── Family: nutrition dashboard ── */
          <>
            {data && (
              <SummaryBand
                totalKcal={data.summary.totalKcal}
                membersOnTarget={data.summary.membersOnTarget}
                memberCount={data.members.length}
                totalMeals={data.summary.totalMeals}
              />
            )}

            {alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cần chú ý</Text>
                {alerts.map((m) => (
                  <AlertBanner key={m.profileId} name={m.displayName} status={m.status} alertFlags={m.alertFlags} />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thành viên</Text>
              {(data?.members ?? []).map((m) => (
                <MemberCard key={m.profileId} member={m as DashboardMember} />
              ))}
              {(data?.members.length ?? 0) === 0 && (
                <Text style={styles.empty}>Chưa có dữ liệu thành viên</Text>
              )}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 12,
    },
    title: { fontSize: 30, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.4 },
    sub: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 2 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
    segmented: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 14,
      backgroundColor: theme.colors.divider, borderRadius: 9, padding: 2,
    },
    segment: {
      flex: 1, paddingVertical: 6, paddingHorizontal: 8,
      borderRadius: 7, alignItems: 'center', justifyContent: 'center',
    },
    segmentActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    segmentText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
    segmentTextActive: { color: theme.colors.text },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, paddingHorizontal: 16, marginBottom: 10 },
    privacyNote: { fontSize: 13, lineHeight: 18, color: theme.colors.textTertiary, paddingHorizontal: 20 },
    empty: { fontSize: 15, color: theme.colors.textTertiary, paddingHorizontal: 16 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyGlyph: {
      width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    emptySub: { fontSize: 15, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 6, marginBottom: 24 },
    createBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.primary,
      paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    joinBtn: { marginTop: 14, padding: 10 },
    joinBtnText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
  });
}
