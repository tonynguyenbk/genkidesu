import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc, queryClient } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';

const ACTIVITY_LEVELS = [
  { value: 1, label: 'Ít vận động', sub: 'Ngồi văn phòng cả ngày' },
  { value: 2, label: 'Vận động nhẹ', sub: '1-3 buổi/tuần' },
  { value: 3, label: 'Vận động vừa', sub: '3-5 buổi/tuần' },
  { value: 4, label: 'Vận động nhiều', sub: '6-7 buổi/tuần' },
  { value: 5, label: 'Rất nhiều', sub: 'Vận động viên chuyên nghiệp' },
];

const TARGET_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#2ECC71' },
  { key: 'protein_g', label: 'Protein', unit: 'g', color: '#3B82F6' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g', color: '#F59E0B' },
  { key: 'fat_g', label: 'Fat', unit: 'g', color: '#EF4444' },
] as const;

export default function EditProfileScreen() {
  const router = useRouter();
  const { activeProfile: profile, isLoading } = useActiveProfile();

  const [name, setName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState(2);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setHeightCm(profile.heightCm ? String(profile.heightCm) : '');
    setWeightKg(profile.weightKg ? String(profile.weightKg) : '');
    setActivityLevel(profile.activityLevel ?? 2);
  }, [profile?.id]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['profile', 'list']] });
      Alert.alert('Đã lưu', 'Thông tin hồ sơ đã được cập nhật');
      router.back();
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleSave = () => {
    if (!profile) return;
    if (!name.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên');
    updateProfile.mutate({
      id: profile.id,
      name: name.trim(),
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      activityLevel,
    });
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2ECC71" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const targets = (profile.nutritionTargets as Record<string, number> | null) ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tên của bạn"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Chiều cao (cm)</Text>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="170"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Cân nặng (kg)</Text>
              <TextInput
                style={styles.input}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="65"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mức độ vận động</Text>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.activityRow, activityLevel === a.value && styles.activityRowActive]}
                onPress={() => setActivityLevel(a.value)}
              >
                <View style={[styles.radio, activityLevel === a.value && styles.radioActive]}>
                  {activityLevel === a.value && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityLabel, activityLevel === a.value && styles.activityLabelActive]}>
                    {a.label}
                  </Text>
                  <Text style={styles.activitySub}>{a.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mục tiêu dinh dưỡng</Text>
          <Text style={styles.sectionNote}>
            Tự động tính lại theo chiều cao, cân nặng và mức độ vận động khi bạn lưu thay đổi.
          </Text>
          <View style={styles.targetsCard}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>TDEE</Text>
              <Text style={styles.targetValue}>
                {profile.tdeeKcal ? `${Math.round(profile.tdeeKcal).toLocaleString()} kcal` : '–'}
              </Text>
            </View>
            {TARGET_FIELDS.map((f) => (
              <View key={f.key} style={styles.targetRow}>
                <Text style={styles.targetLabel}>{f.label}</Text>
                <Text style={[styles.targetValue, { color: f.color }]}>
                  {targets?.[f.key] != null ? `${targets[f.key]}${f.unit === 'kcal' ? ' kcal' : 'g'}` : '–'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updateProfile.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  section: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  sectionNote: { fontSize: 12, color: '#9CA3AF', marginTop: -8, lineHeight: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#111827', backgroundColor: '#fff',
  },
  row: { flexDirection: 'row' },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  activityRowActive: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#2ECC71' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ECC71' },
  activityLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  activityLabelActive: { color: '#2ECC71' },
  activitySub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  targetsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  targetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  targetLabel: { fontSize: 14, color: '#6B7280' },
  targetValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  saveBtn: {
    backgroundColor: '#2ECC71', marginHorizontal: 20, marginTop: 24,
    padding: 17, borderRadius: 14, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
