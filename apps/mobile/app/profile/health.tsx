import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';

const CONDITION_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  diabetes_type2: { label: 'Tiểu đường type 2', icon: '🩸', desc: 'Kiểm soát đường huyết, hạn chế carbs', color: '#DC2626' },
  hypertension:   { label: 'Huyết áp cao',      icon: '💓', desc: 'Hạn chế muối và thực phẩm chế biến sẵn', color: '#EA580C' },
  gout:           { label: 'Gout',               icon: '🦴', desc: 'Hạn chế purin: hải sản, nội tạng, thịt đỏ', color: '#9333EA' },
  heart_disease:  { label: 'Tim mạch',           icon: '❤️', desc: 'Hạn chế chất béo bão hòa và đồ chiên rán', color: '#E11D48' },
  kidney:         { label: 'Bệnh thận',          icon: '🫘', desc: 'Kiểm soát protein, kali và photpho', color: '#0284C7' },
  allergy:        { label: 'Dị ứng thực phẩm',  icon: '⚠️', desc: 'Cảnh báo khi phát hiện thực phẩm gây dị ứng', color: '#CA8A04' },
};

const ALL_CONDITIONS = Object.keys(CONDITION_META) as (keyof typeof CONDITION_META)[];

export default function HealthConditionsScreen() {
  const router = useRouter();
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
          <Ionicons name="arrow-back" size={22} color="#111827" />
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
            <ActivityIndicator color="#2ECC71" style={{ margin: 20 }} />
          ) : (conditions.data ?? []).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
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
                    <Text style={styles.conditionIcon}>{meta.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.conditionLabel}>{meta.label}</Text>
                      <Text style={styles.conditionDesc}>{meta.desc}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmRemove(c.id, meta.label)}
                      style={styles.removeBtn}
                      disabled={removeMutation.isPending}
                    >
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#2ECC71" />
          <Text style={styles.addBtnText}>Thêm bệnh lý</Text>
        </TouchableOpacity>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
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
                <Ionicons name="close" size={22} color="#6B7280" />
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
                    <Text style={styles.optionIcon}>{meta.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, already && { color: '#9CA3AF' }]}>{meta.label}</Text>
                      <Text style={styles.optionDesc}>{meta.desc}</Text>
                    </View>
                    {already ? (
                      <Ionicons name="checkmark-circle" size={20} color="#9CA3AF" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={20} color="#2ECC71" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, margin: 16 },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, paddingLeft: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  conditionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  conditionRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  conditionIcon: { fontSize: 24 },
  conditionLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  conditionDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  removeBtn: { padding: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2ECC71', borderStyle: 'dashed', backgroundColor: '#F0FDF4',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#2ECC71' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 16, padding: 14, backgroundColor: '#EFF6FF',
    borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 12, color: '#1D4ED8', lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  optionRowActive: { backgroundColor: '#F9FAFB' },
  optionIcon: { fontSize: 22 },
  optionLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  optionDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
