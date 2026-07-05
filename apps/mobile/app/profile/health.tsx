import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CONDITION_META: Record<string, { label: string; icon: IoniconName; desc: string; color: string }> = {
  diabetes_type2: { label: 'Tiểu đường type 2', icon: 'water-outline',    desc: 'Kiểm soát đường huyết, hạn chế carbs', color: '#FF3B30' },
  hypertension:   { label: 'Huyết áp cao',      icon: 'pulse-outline',    desc: 'Hạn chế muối và thực phẩm chế biến sẵn', color: '#FF9500' },
  gout:           { label: 'Gout',               icon: 'body-outline',     desc: 'Hạn chế purin: hải sản, nội tạng, thịt đỏ', color: '#AF52DE' },
  heart_disease:  { label: 'Tim mạch',           icon: 'heart-outline',    desc: 'Hạn chế chất béo bão hòa và đồ chiên rán', color: '#FF2D55' },
  kidney:         { label: 'Bệnh thận',          icon: 'filter-outline',   desc: 'Kiểm soát protein, kali và photpho', color: '#007AFF' },
  allergy:        { label: 'Dị ứng thực phẩm',  icon: 'alert-circle-outline', desc: 'Cảnh báo khi phát hiện thực phẩm gây dị ứng', color: '#FF9500' },
};

const ALL_CONDITIONS = Object.keys(CONDITION_META) as (keyof typeof CONDITION_META)[];

export default function HealthConditionsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? '';

  const [showAddModal, setShowAddModal] = useState(false);

  const utils = trpc.useUtils();
  const conditions = trpc.health.listConditions.useQuery(
    { profileId },
    { enabled: !!profileId, retry: false },
  );

  const addMutation = trpc.health.addCondition.useMutation({
    onSuccess: () => {
      utils.health.listConditions.invalidate({ profileId });
      setShowAddModal(false);
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const removeMutation = trpc.health.removeCondition.useMutation({
    onSuccess: () => utils.health.listConditions.invalidate({ profileId }),
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const activeConditionKeys = new Set((conditions.data ?? []).map((c) => c.condition));

  const confirmRemove = (id: string, label: string) => {
    Alert.alert('Xóa bệnh lý?', `Bỏ "${label}" khỏi hồ sơ này?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => removeMutation.mutate({ id }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bệnh lý & Chế độ ăn</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Genki sẽ cảnh báo khi phát hiện món ăn không phù hợp với bệnh lý của{' '}
          <Text style={{ fontWeight: '700' }}>{activeProfile?.name ?? 'bạn'}</Text>.
        </Text>

        {/* Current conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bệnh lý hiện tại</Text>

          {conditions.isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ margin: 20 }} />
          ) : (conditions.data ?? []).length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shield-checkmark-outline" size={32} color={theme.colors.success} />
              <Text style={styles.emptyText}>Chưa có bệnh lý nào được ghi nhận</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {(conditions.data ?? []).map((c, i) => {
                const meta = CONDITION_META[c.condition];
                if (!meta) return null;
                return (
                  <View
                    key={c.id}
                    style={[styles.conditionRow, i < (conditions.data!.length - 1) && styles.conditionRowBorder]}
                  >
                    <View style={[styles.conditionGlyph, { backgroundColor: meta.color + '1A' }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conditionLabel}>{meta.label}</Text>
                      <Text style={styles.conditionDesc}>{meta.desc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmRemove(c.id, meta.label)}
                      style={styles.removeBtn}
                      disabled={removeMutation.isPending}
                    >
                      <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.addBtnText}>Thêm bệnh lý</Text>
        </TouchableOpacity>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Thông tin bệnh lý chỉ dùng để tạo cảnh báo dinh dưỡng — không được chia sẻ ra ngoài ứng dụng.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Chọn bệnh lý</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {ALL_CONDITIONS.map((key) => {
                const meta = CONDITION_META[key]!;
                const already = activeConditionKeys.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.optionRow, already && styles.optionRowActive]}
                    onPress={() => {
                      if (!already) {
                        addMutation.mutate({ profileId, condition: key as any });
                      }
                    }}
                    disabled={already || addMutation.isPending}
                  >
                    <View style={[styles.conditionGlyph, { backgroundColor: meta.color + '1A' }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, already && { color: theme.colors.textTertiary }]}>{meta.label}</Text>
                      <Text style={styles.optionDesc}>{meta.desc}</Text>
                    </View>
                    {already ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.textTertiary} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
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
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface,
    },
    backBtn: { width: 38, height: 38, justifyContent: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, margin: 16 },
    section: { marginHorizontal: 16, marginBottom: 12 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textTertiary, marginBottom: 8, paddingLeft: 2 },
    card: {
      backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden',
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 24,
      alignItems: 'center', gap: 8,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    emptyIcon: { fontSize: 32 },
    emptyText: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' },
    conditionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    conditionRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    conditionGlyph: {
      width: 34, height: 34, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    conditionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    conditionDesc: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    removeBtn: { padding: 4 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 16, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: theme.colors.primary, borderStyle: 'dashed', backgroundColor: theme.colors.surfaceAlt,
    },
    addBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      margin: 16, padding: 14, backgroundColor: theme.colors.infoBg,
      borderRadius: 12, borderWidth: 1, borderColor: theme.colors.info,
    },
    infoText: { flex: 1, fontSize: 12, color: theme.colors.info, lineHeight: 18 },
    overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingBottom: 32, maxHeight: '80%',
    },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    optionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    optionRowActive: { backgroundColor: theme.colors.divider },
    optionIcon: { fontSize: 22 },
    optionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    optionDesc: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
  });
}
