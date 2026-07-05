import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator, Modal, Alert as RNAlert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { trpc } from '../../lib/trpc';
import type { Theme } from '@genki/ui';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

const TYPE_COLORS: Record<string, string> = {
  adult: '#34C759', senior: '#FF9F0A', teen: '#AF52DE', baby: '#FF2D55',
};
const TYPE_LABELS: Record<string, string> = {
  adult: 'Người lớn', baby: 'Em bé', teen: 'Thiếu niên', senior: 'Người cao tuổi',
};
const SEVERITY_ICONS: Record<string, string> = {
  info: 'information-circle-outline',
  warning: 'alert-circle-outline',
  danger: 'warning-outline',
};

type Alert = {
  profileId: string;
  profileName: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
};

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  if (alerts.length === 0) return null;

  const SEVERITY_COLORS = { info: theme.colors.info, warning: theme.colors.warning, danger: theme.colors.error };
  const SEVERITY_BG = { info: theme.colors.infoBg, warning: theme.colors.warningBg, danger: theme.colors.errorBg };

  const shown = expanded ? alerts : alerts.slice(0, 2);
  const dangerCount = alerts.filter((a) => a.severity === 'danger').length;
  const warnCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <View style={styles.alertSection}>
      <TouchableOpacity
        style={styles.alertHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.alertHeaderLeft}>
          <Ionicons name="notifications" size={16} color={theme.colors.warning} />
          <Text style={styles.alertHeaderText}>
            {dangerCount > 0 ? `${dangerCount} cảnh báo · ` : ''}
            {warnCount > 0 ? `${warnCount} lưu ý` : `${alerts.length} thông báo`}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.colors.textTertiary} />
      </TouchableOpacity>

      {shown.map((alert, i) => {
        const color = SEVERITY_COLORS[alert.severity];
        const bg = SEVERITY_BG[alert.severity];
        const icon = SEVERITY_ICONS[alert.severity] ?? 'information-circle-outline';
        return (
          <View key={i} style={[styles.alertRow, { backgroundColor: bg, borderLeftColor: color }]}>
            <Ionicons name={icon as any} size={16} color={color} />
            <Text style={[styles.alertText, { color }]}>{alert.message}</Text>
          </View>
        );
      })}

      {alerts.length > 2 && (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.alertMore}>
            {expanded ? 'Thu gọn' : `+${alerts.length - 2} thông báo nữa`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FamilyOverviewCard({ members }: { members: any[] }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const visibleMembers = members.filter(
    (m) => (m.privacySettings as any)?.show_details_to_family !== false,
  );

  let totalCal = 0;
  let totalGoal = 0;
  let onTrack = 0;

  for (const m of visibleMembers) {
    const profile = m.profile as any;
    const summary = profile.dailySummaries?.[0];
    const goal =
      (profile.nutritionTargets as any)?.calories ?? profile.tdeeKcal ?? 1800;
    const eaten = summary?.totalCalories ?? 0;
    totalCal += eaten;
    totalGoal += goal;
    if (eaten >= goal * 0.8) onTrack++;
  }

  const pct = totalGoal > 0 ? Math.min(Math.round((totalCal / totalGoal) * 100), 100) : 0;

  return (
    <View style={styles.overviewCard}>
      <Text style={styles.overviewTitle}>Tổng quan nhóm hôm nay</Text>
      <View style={styles.overviewRow}>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewVal}>{totalCal.toLocaleString()}</Text>
          <Text style={styles.overviewLabel}>kcal tổng cộng</Text>
        </View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewStat}>
          <Text style={styles.overviewVal}>{pct}%</Text>
          <Text style={styles.overviewLabel}>trung bình mục tiêu</Text>
        </View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewVal, { color: theme.colors.primary }]}>{onTrack}/{visibleMembers.length}</Text>
          <Text style={styles.overviewLabel}>đạt mục tiêu</Text>
        </View>
      </View>
      <View style={styles.overviewBarBg}>
        <View style={[styles.overviewBarFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const styles = useThemedStyles(createStyles);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroVal}>{Math.round(value)}g</Text>
    </View>
  );
}

function MemberCard({ member, onPress }: { member: Record<string, any>; onPress: () => void }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const profile = member.profile as Record<string, any>;
  const color = TYPE_COLORS[profile.type as string] ?? theme.colors.primary;
  const todaySummary = (profile.dailySummaries as any[])?.[0];
  const caloriesEaten = (todaySummary?.totalCalories as number) ?? 0;
  const caloriesGoal =
    (profile.nutritionTargets as any)?.calories ?? (profile.tdeeKcal as number) ?? 1800;
  const proteinG = (todaySummary?.totalProteinG as number) ?? 0;
  const carbsG = (todaySummary?.totalCarbsG as number) ?? 0;
  const fatG = (todaySummary?.totalFatG as number) ?? 0;
  const proteinGoal = (profile.nutritionTargets as any)?.protein_g ?? 60;
  const carbsGoal = (profile.nutritionTargets as any)?.carbs_g ?? 200;
  const fatGoal = (profile.nutritionTargets as any)?.fat_g ?? 55;
  const mealCount = (profile.mealLogs as any[])?.length ?? 0;
  const pct = caloriesGoal > 0 ? Math.min(Math.round((caloriesEaten / caloriesGoal) * 100), 100) : 0;
  const initial = (profile.name as string)?.[0]?.toUpperCase() ?? '?';
  const isPrivate = (member.privacySettings as any)?.show_details_to_family === false;

  return (
    <TouchableOpacity style={styles.memberCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.memberAvatarText, { color }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.memberTop}>
          <View>
            <Text style={styles.memberName}>{profile.name as string}</Text>
            <Text style={styles.memberType}>
              {TYPE_LABELS[profile.type as string] ?? (profile.type as string)}
              {(member.role as string) === 'owner' ? ' · Trưởng nhóm' : ''}
            </Text>
          </View>
          {isPrivate ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed-outline" size={13} color={theme.colors.textTertiary} />
              <Text style={styles.privateLabel}>Riêng tư</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.memberCal, { color }]}>{Math.round(caloriesEaten)} kcal</Text>
              <Text style={styles.mealCountLabel}>{mealCount} bữa</Text>
            </View>
          )}
        </View>

        {!isPrivate && (
          <>
            <View style={styles.memberBar}>
              <View style={[styles.memberBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={styles.memberPct}>{pct}% mục tiêu ({Math.round(caloriesGoal)} kcal)</Text>

            {(proteinG > 0 || carbsG > 0 || fatG > 0) && (
              <View style={styles.macrosSection}>
                <MacroBar label="P" value={proteinG} max={proteinGoal} color={theme.colors.info} />
                <MacroBar label="C" value={carbsG} max={carbsGoal} color={theme.colors.warning} />
                <MacroBar label="F" value={fatG} max={fatGoal} color={theme.colors.error} />
              </View>
            )}
          </>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );
}

function EmptyState() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyGlyph}>
        <Ionicons name="people-outline" size={38} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Chưa có nhóm</Text>
      <Text style={styles.emptySub}>Tạo nhóm để theo dõi dinh dưỡng cùng nhau</Text>
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/family/create')}>
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.createBtnText}>Tạo nhóm</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/family/join')}>
        <Ionicons name="link-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.joinBtnText}>Tham gia bằng mã mời</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [copied, setCopied] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  const families = trpc.family.list.useQuery(undefined, { retry: false });
  const family = (families.data as any[])?.[0];
  const utils = trpc.useUtils();

  const dashboard = trpc.family.getDashboard.useQuery(
    { familyId: family?.id ?? '' },
    { enabled: !!family?.id },
  );

  const alertsQuery = trpc.family.getAlerts.useQuery(
    { familyId: family?.id ?? '' },
    { enabled: !!family?.id, staleTime: 60_000 },
  );

  const allProfiles = trpc.profile.list.useQuery(undefined, { retry: false });
  const memberProfileIds = new Set(
    ((dashboard.data as any)?.members ?? []).map((m: any) => m.profile.id as string),
  );
  const unaddedProfiles = (allProfiles.data ?? []).filter((p) => !memberProfileIds.has(p.id));

  const addProfileMutation = trpc.family.addProfile.useMutation({
    onSuccess: () => {
      utils.family.getDashboard.invalidate({ familyId: family?.id });
      utils.family.getAlerts.invalidate({ familyId: family?.id });
    },
    onError: (e) => RNAlert.alert('Lỗi', e.message),
  });

  const handleCopyCode = async () => {
    if (!family?.inviteCode) return;
    await Clipboard.setStringAsync(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (families.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const members = (dashboard.data as any)?.members ?? [];
  const alerts: Alert[] = (alertsQuery.data?.alerts ?? []) as Alert[];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!family ? (
          <EmptyState />
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{family.name}</Text>
                <Text style={styles.sub}>
                  {members.length} thành viên · Hôm nay
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/profile/create')}
              >
                <Ionicons name="person-add-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Family overview */}
            {members.length > 0 && <FamilyOverviewCard members={members} />}

            {/* Alerts */}
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}

            {/* Invite code banner */}
            <TouchableOpacity style={styles.inviteBanner} onPress={handleCopyCode} activeOpacity={0.8}>
              <View>
                <Text style={styles.inviteLabel}>Mã mời nhóm</Text>
                <Text style={styles.inviteCode}>{family.inviteCode}</Text>
              </View>
              <View style={styles.copyChip}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copied ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[styles.copyText, copied && { color: theme.colors.primary }]}>
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
              {dashboard.isLoading ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
              ) : members.length === 0 ? (
                <Text style={styles.noMembers}>Chưa có thành viên nào</Text>
              ) : (
                members.map((m: any) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onPress={() => router.push(`/family/member/${m.profile.id}` as any)}
                  />
                ))
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCopyCode}
              >
                <Ionicons name={copied ? 'checkmark-circle' : 'share-outline'} size={18} color={theme.colors.primary} />
                <Text style={styles.actionText}>{copied ? 'Đã sao chép!' : 'Chia sẻ mã mời'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSec]}
                onPress={() => unaddedProfiles.length > 0 ? setShowAddProfile(true) : router.push('/profile/create')}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>Thêm hồ sơ</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: add existing profile to family */}
      <Modal visible={showAddProfile} transparent animationType="slide" onRequestClose={() => setShowAddProfile(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddProfile(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Thêm vào nhóm</Text>
              <TouchableOpacity onPress={() => setShowAddProfile(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {unaddedProfiles.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 14 }}>Tất cả hồ sơ đã trong nhóm</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { marginTop: 16, paddingHorizontal: 24 }]}
                    onPress={() => { setShowAddProfile(false); router.push('/profile/create'); }}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Tạo hồ sơ mới</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                unaddedProfiles.map((p) => {
                  const color = TYPE_COLORS[p.type] ?? theme.colors.primary;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.profileOption}
                      onPress={() => {
                        addProfileMutation.mutate({ familyId: family.id, profileId: p.id });
                        setShowAddProfile(false);
                      }}
                      disabled={addProfileMutation.isPending}
                    >
                      <View style={[styles.profileOptionAvatar, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.profileOptionAvatarText, { color }]}>
                          {p.name[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileOptionName}>{p.name}</Text>
                        <Text style={styles.profileOptionType}>{TYPE_LABELS[p.type] ?? p.type}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 12,
    },
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
    sub: { fontSize: 13, color: theme.colors.textTertiary, marginTop: 2 },
    addBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
    },

    // Overview card
    overviewCard: {
      backgroundColor: theme.colors.surface, borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
      padding: 16, shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    overviewTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textTertiary, marginBottom: 12 },
    overviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    overviewStat: { flex: 1, alignItems: 'center' },
    overviewVal: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    overviewLabel: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2, textAlign: 'center' },
    overviewDivider: { width: 1, height: 36, backgroundColor: theme.colors.divider },
    overviewBarBg: {
      height: 6, backgroundColor: theme.colors.divider, borderRadius: 3, overflow: 'hidden',
    },
    overviewBarFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },

    // Alerts
    alertSection: {
      marginHorizontal: 16, marginBottom: 16,
      backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden',
      shadowColor: theme.colors.shadow, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    alertHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    alertHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    alertHeaderText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    alertRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      paddingHorizontal: 12, paddingVertical: 10,
      borderLeftWidth: 3,
    },
    alertText: { fontSize: 13, flex: 1, lineHeight: 18, fontWeight: '500' },
    alertMore: {
      fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center',
      paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.divider,
    },

    // Invite
    inviteBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceAlt, borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
      padding: 16, borderWidth: 1, borderColor: theme.colors.successBg,
    },
    inviteLabel: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 },
    inviteCode: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, letterSpacing: 6 },
    copyChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border,
    },
    copyText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },

    // Members
    section: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
    noMembers: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 20 },
    memberCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14,
      flexDirection: 'row', gap: 12,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    memberAvatar: {
      width: 46, height: 46, borderRadius: 23,
      justifyContent: 'center', alignItems: 'center',
    },
    memberAvatarText: { fontSize: 18, fontWeight: '700' },
    memberTop: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 6,
    },
    memberName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    memberType: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2 },
    memberCal: { fontSize: 14, fontWeight: '700' },
    mealCountLabel: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 1, textAlign: 'right' },
    privateLabel: { fontSize: 12, color: theme.colors.textTertiary },
    memberBar: {
      height: 4, backgroundColor: theme.colors.divider, borderRadius: 2,
      overflow: 'hidden', marginBottom: 3,
    },
    memberBarFill: { height: 4, borderRadius: 2 },
    memberPct: { fontSize: 11, color: theme.colors.textTertiary, marginBottom: 6 },

    // Macros
    macrosSection: { gap: 3 },
    macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    macroLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textTertiary, width: 12 },
    macroBarBg: { flex: 1, height: 3, backgroundColor: theme.colors.divider, borderRadius: 2, overflow: 'hidden' },
    macroBarFill: { height: 3, borderRadius: 2 },
    macroVal: { fontSize: 10, color: theme.colors.textTertiary, width: 32, textAlign: 'right' },

    // Actions
    actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.surfaceAlt, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primary,
    },
    actionBtnSec: { backgroundColor: theme.colors.divider, borderColor: theme.colors.border },
    actionText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

    // Add profile modal
    overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, maxHeight: '70%' },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    profileOption: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    profileOptionAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    profileOptionAvatarText: { fontSize: 18, fontWeight: '700' },
    profileOptionName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    profileOptionType: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },

    // Empty state
    emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
    emptyGlyph: {
      width: 76, height: 76, borderRadius: 22, backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    emptySub: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 20 },
    createBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 14,
      borderRadius: 14, marginTop: 8, width: '100%',
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    joinBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.surface, paddingHorizontal: 28, paddingVertical: 14,
      borderRadius: 14, width: '100%', borderWidth: 1, borderColor: theme.colors.primary,
    },
    joinBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  });
}
