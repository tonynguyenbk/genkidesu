import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc, queryClient } from '../lib/trpc';
import { getWhoMedianCurve, type GrowthMetric, type GrowthStatus } from '@genki/shared';

const STATUS_COLOR: Record<GrowthStatus, string> = {
  severely_low: '#DC2626',
  low: '#F59E0B',
  normal: '#16A34A',
  high: '#F59E0B',
  severely_high: '#DC2626',
};

function MiniChart({
  metric, gender, points,
}: {
  metric: GrowthMetric;
  gender: 'male' | 'female' | 'other';
  points: { ageMonths: number; value: number }[];
}) {
  const curve = getWhoMedianCurve(metric, gender === 'female' ? 'female' : 'male');
  const width = 300;
  const height = 140;
  const maxAge = 24;
  const allValues = [...curve.map((c) => c.median), ...points.map((p) => p.value)];
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;

  const x = (age: number) => (age / maxAge) * (width - 20) + 10;
  const y = (val: number) => height - 10 - ((val - minVal) / (maxVal - minVal)) * (height - 20);

  const curvePath = curve.map((c) => `${x(c.ageMonths)},${y(c.median)}`).join(' ');

  return (
    <View style={styles.chartWrap}>
      <View style={{ width, height }}>
        {/* WHO median line, drawn as overlapping segments via View borders is complex in RN —
            show curve as a faint connected dotted reference using positioned dots */}
        {curve.filter((_, i) => i % 2 === 0).map((c) => (
          <View
            key={`ref-${c.ageMonths}`}
            style={[styles.refDot, { left: x(c.ageMonths) - 2, top: y(c.median) - 2 }]}
          />
        ))}
        {points.map((p, i) => (
          <View
            key={`pt-${i}`}
            style={[styles.dataDot, { left: x(p.ageMonths) - 4, top: y(p.value) - 4 }]}
          />
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Trung vị WHO</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Bé {gender === 'female' ? '(gái)' : '(trai)'}</Text>
        </View>
      </View>
      <Text style={styles.chartHint}>Trục ngang: tháng tuổi (0–24) · {curvePath ? '' : ''}</Text>
    </View>
  );
}

export default function GrowthChartScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const history = trpc.profile.getGrowthHistory.useQuery(
    { profileId: profileId ?? '' },
    { enabled: !!profileId },
  );

  const addMeasurement = trpc.profile.addGrowthMeasurement.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['profile', 'getGrowthHistory']] });
      setShowForm(false);
      setHeightCm('');
      setWeightKg('');
    },
    onError: (e: { message: string }) => Alert.alert('Lỗi', e.message),
  });

  const gender = (history.data?.gender ?? 'male') as 'male' | 'female' | 'other';
  const records = history.data?.records ?? [];
  const latest = history.data?.latest ?? null;

  const heightPoints = useMemo(
    () => records.filter((r) => r.heightCm != null).map((r) => ({ ageMonths: r.ageMonths, value: r.heightCm! })),
    [records],
  );
  const weightPoints = useMemo(
    () => records.filter((r) => r.weightKg != null).map((r) => ({ ageMonths: r.ageMonths, value: r.weightKg! })),
    [records],
  );

  const handleSubmit = () => {
    if (!profileId) return;
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h && !w) {
      Alert.alert('Thiếu thông tin', 'Nhập ít nhất chiều cao hoặc cân nặng');
      return;
    }
    addMeasurement.mutate({
      profileId,
      measuredAt: new Date().toISOString(),
      ...(h ? { heightCm: h } : {}),
      ...(w ? { weightKg: w } : {}),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Biểu đồ tăng trưởng</Text>
        <TouchableOpacity onPress={() => setShowForm((s) => !s)} style={styles.addBtn}>
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#EC4899" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.note}>
          So sánh chiều cao &amp; cân nặng của bé với chuẩn tăng trưởng WHO (áp dụng cho trẻ 0–24 tháng tuổi).
        </Text>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Ghi nhận số đo mới</Text>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Chiều cao (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="decimal-pad"
                  placeholder="VD: 65"
                  placeholderTextColor="#D1D5DB"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Cân nặng (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="decimal-pad"
                  placeholder="VD: 7.5"
                  placeholderTextColor="#D1D5DB"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, addMeasurement.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={addMeasurement.isPending}
            >
              {addMeasurement.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Lưu số đo</Text>}
            </TouchableOpacity>
          </View>
        )}

        {history.isLoading ? (
          <ActivityIndicator color="#EC4899" style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="body-outline" size={40} color="#FBCFE8" />
            <Text style={styles.emptyText}>Chưa có số đo nào — bấm “+” để thêm số đo đầu tiên</Text>
          </View>
        ) : (
          <>
            {latest && (
              <View style={styles.assessmentRow}>
                {latest.heightAssessment && (
                  <View style={[styles.assessCard, { borderColor: STATUS_COLOR[latest.heightAssessment.status] }]}>
                    <Text style={styles.assessLabel}>Chiều cao</Text>
                    <Text style={[styles.assessStatus, { color: STATUS_COLOR[latest.heightAssessment.status] }]}>
                      {latest.heightAssessment.label}
                    </Text>
                    <Text style={styles.assessZ}>Z-score: {latest.heightAssessment.zScore}</Text>
                  </View>
                )}
                {latest.weightAssessment && (
                  <View style={[styles.assessCard, { borderColor: STATUS_COLOR[latest.weightAssessment.status] }]}>
                    <Text style={styles.assessLabel}>Cân nặng</Text>
                    <Text style={[styles.assessStatus, { color: STATUS_COLOR[latest.weightAssessment.status] }]}>
                      {latest.weightAssessment.label}
                    </Text>
                    <Text style={styles.assessZ}>Z-score: {latest.weightAssessment.zScore}</Text>
                  </View>
                )}
              </View>
            )}

            {heightPoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chiều cao theo tháng tuổi</Text>
                <MiniChart metric="height" gender={gender} points={heightPoints} />
              </View>
            )}

            {weightPoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cân nặng theo tháng tuổi</Text>
                <MiniChart metric="weight" gender={gender} points={weightPoints} />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lịch sử đo</Text>
              {[...records].reverse().map((r) => (
                <View key={r.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {new Date(r.measuredAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                  <Text style={styles.historyAge}>{r.ageMonths} tháng</Text>
                  <Text style={styles.historyVal}>
                    {r.heightCm != null ? `${r.heightCm} cm` : '—'}
                  </Text>
                  <Text style={styles.historyVal}>
                    {r.weightKg != null ? `${r.weightKg} kg` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          * Z-score được ước tính dựa trên bảng chuẩn WHO Child Growth Standards (0–24 tháng), chỉ mang tính tham khảo — không thay thế tư vấn của bác sĩ nhi khoa.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#FCE7F3',
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  note: { fontSize: 13, color: '#9CA3AF', lineHeight: 19 },

  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FCE7F3', gap: 12 },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  formRow: { flexDirection: 'row', gap: 12 },
  formField: { flex: 1 },
  formLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  formInput: {
    borderWidth: 1.5, borderColor: '#FCE7F3', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#111827',
  },
  submitBtn: { backgroundColor: '#EC4899', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },

  assessmentRow: { flexDirection: 'row', gap: 12 },
  assessCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, padding: 14, gap: 4 },
  assessLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  assessStatus: { fontSize: 14, fontWeight: '800' },
  assessZ: { fontSize: 12, color: '#6B7280' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  chartWrap: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FCE7F3', alignItems: 'center' },
  refDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  dataDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC4899', borderWidth: 1.5, borderColor: '#fff' },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  chartHint: { fontSize: 10, color: '#D1D5DB', marginTop: 4 },

  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#FCE7F3',
  },
  historyDate: { fontSize: 12, color: '#6B7280', flex: 1.2 },
  historyAge: { fontSize: 12, color: '#9CA3AF', flex: 1 },
  historyVal: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'right' },

  disclaimer: { fontSize: 11, color: '#D1D5DB', lineHeight: 16, fontStyle: 'italic' },
});
