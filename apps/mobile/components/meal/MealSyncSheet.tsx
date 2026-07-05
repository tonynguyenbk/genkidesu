import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { MemberPortionPicker } from './MemberPortionPicker';

export interface SyncMember { profileId: string; name: string; type: string }

// Default portion: children eat ~half, adults a full share.
const defaultRatio = (type: string) => (type === 'baby' || type === 'teen' ? 0.5 : 1.0);

export function MealSyncSheet({
  visible, onClose, onDone, familyId, mealLogId, sourceKcal, mealName, mealTime, members,
}: {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
  familyId: string;
  mealLogId: string;
  sourceKcal: number;
  mealName: string;
  mealTime: string;
  members: SyncMember[];
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const utils = trpc.useUtils();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ratios, setRatios] = useState<Record<string, number>>(
    () => Object.fromEntries(members.map((m) => [m.profileId, defaultRatio(m.type)])),
  );

  // Conflict check up front — flag members who already logged near this time.
  const conflict = trpc.family.conflictCheck.useQuery(
    { familyId, profileIds: members.map((m) => m.profileId), mealTime, windowMinutes: 30 },
    { enabled: visible && members.length > 0, retry: false },
  );
  const conflictSet = useMemo(
    () => new Set((conflict.data?.conflicts ?? []).map((c) => c.profileId)),
    [conflict.data],
  );

  const sync = trpc.family.mealSync.useMutation({
    onSuccess: (res) => {
      void utils.family.groupDashboard.invalidate();
      void utils.meal.getDailyLogs.invalidate();
      void utils.meal.getDailySummary.invalidate();
      const skipped = res.skipped?.length ?? 0;
      if (res.syncedCount > 0) {
        Alert.alert(
          'Đã đồng bộ',
          `Bữa ăn đã cộng vào ${res.syncedCount} hồ sơ.` +
            (skipped > 0 ? ` ${skipped} người đã có bữa này nên được bỏ qua.` : ''),
        );
      } else {
        Alert.alert('Không có thay đổi', 'Các thành viên đã có bữa ăn này rồi.');
      }
      onDone();
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const chosen = members.filter((m) => selected.has(m.profileId));
  const totalAdded = chosen.reduce((s, m) => s + Math.round(sourceKcal * (ratios[m.profileId] ?? 1)), 0);

  const handleSync = () => {
    sync.mutate({
      familyId,
      mealLogId,
      members: chosen.map((m) => ({ profileId: m.profileId, portionRatio: ratios[m.profileId] ?? 1 })),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>Đồng bộ bữa ăn?</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Food preview */}
          <View style={styles.preview}>
            <View style={styles.previewIcon}><Ionicons name="restaurant" size={20} color={theme.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName} numberOfLines={1}>{mealName}</Text>
              <Text style={styles.previewKcal}>≈ {Math.round(sourceKcal)} kcal / phần</Text>
            </View>
          </View>

          {conflictSet.size > 0 && (
            <View style={styles.conflictBanner}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.warning} />
              <Text style={styles.conflictText}>
                {conflictSet.size} thành viên đã ghi bữa trong 30 phút qua — kiểm tra trước khi đồng bộ
              </Text>
            </View>
          )}

          <Text style={styles.listLabel}>Ai ăn cùng?</Text>
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {members.map((m) => (
              <MemberPortionPicker
                key={m.profileId}
                name={m.name}
                type={m.type}
                selected={selected.has(m.profileId)}
                ratio={ratios[m.profileId] ?? 1}
                kcalBase={sourceKcal}
                conflict={conflictSet.has(m.profileId)}
                onToggle={() => toggle(m.profileId)}
                onRatioChange={(r) => setRatios((prev) => ({ ...prev, [m.profileId]: r }))}
              />
            ))}
            {members.length === 0 && <Text style={styles.empty}>Nhóm chưa có thành viên khác</Text>}
          </ScrollView>

          {/* Summary + CTA */}
          {chosen.length > 0 && (
            <Text style={styles.summary}>Sẽ cộng vào hồ sơ {chosen.length} thành viên · +{totalAdded} kcal tổng</Text>
          )}
          <TouchableOpacity
            style={[styles.cta, (chosen.length === 0 || sync.isPending) && styles.ctaDisabled]}
            onPress={handleSync}
            disabled={chosen.length === 0 || sync.isPending}
          >
            {sync.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>{chosen.length > 0 ? `Đồng bộ cho ${chosen.length} người` : 'Chọn thành viên'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.skip} onPress={onClose}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 28, maxHeight: '90%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 12 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    title: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
    preview: {
      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
      backgroundColor: theme.colors.surface, marginBottom: 12,
    },
    previewIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    previewName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    previewKcal: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    conflictBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 12,
      backgroundColor: theme.colors.warningBg, borderWidth: 1, borderColor: theme.colors.warning,
    },
    conflictText: { flex: 1, fontSize: 12, color: theme.colors.warning },
    listLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 10 },
    empty: { fontSize: 13, color: theme.colors.textTertiary, paddingVertical: 12 },
    summary: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 10 },
    cta: {
      backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 4,
    },
    ctaDisabled: { backgroundColor: theme.colors.textTertiary },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skip: { alignItems: 'center', padding: 12 },
    skipText: { fontSize: 14, color: theme.colors.textTertiary, fontWeight: '600' },
  });
}
