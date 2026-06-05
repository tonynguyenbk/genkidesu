import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';

type ProfileType = 'adult' | 'baby' | 'teen' | 'senior';
type Gender = 'male' | 'female' | 'other';

const ACTIVITY_LEVELS = [
  { value: 1, label: 'Ít vận động', sub: 'Ngồi văn phòng cả ngày' },
  { value: 2, label: 'Vận động nhẹ', sub: '1-3 buổi/tuần' },
  { value: 3, label: 'Vận động vừa', sub: '3-5 buổi/tuần' },
  { value: 4, label: 'Vận động nhiều', sub: '6-7 buổi/tuần' },
  { value: 5, label: 'Rất nhiều', sub: 'Vận động viên chuyên nghiệp' },
];

export default function CreateProfileScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthYear, setBirthYear] = useState('1990');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState(2);

  const createProfile = trpc.profile.create.useMutation({
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleCreate = async () => {
    const birthDate = new Date(`${birthYear}-06-15T00:00:00.000Z`).toISOString();
    await createProfile.mutateAsync({
      name: name || 'Tôi',
      type: 'adult',
      gender,
      birthDate,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      activityLevel,
    });
    setStep(4);
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Back button (steps 2+) */}
        {step > 1 && step < 4 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
        )}

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <View style={styles.section}>
            <View style={styles.welcomeIcon}>
              <Text style={{ fontSize: 56 }}>👋</Text>
            </View>
            <Text style={styles.title}>Chào mừng đến Genki!</Text>
            <Text style={styles.subtitle}>
              Hãy tạo hồ sơ để Genki tính toán nhu cầu dinh dưỡng cá nhân hoá cho bạn.
            </Text>
            <View style={styles.features}>
              {[
                { icon: '🎯', text: 'Tính TDEE theo cơ thể thật của bạn' },
                { icon: '📊', text: 'Theo dõi macro & vi chất mỗi ngày' },
                { icon: '👨‍👩‍👧', text: 'Chia sẻ với gia đình' },
              ].map((f) => (
                <View key={f.icon} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Bắt đầu →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Basic info ── */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>BƯỚC 1/2</Text>
            <Text style={styles.title}>Thông tin cơ bản</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tên của bạn</Text>
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.chips}>
                {([['male', 'Nam 👨'], ['female', 'Nữ 👩'], ['other', 'Khác']] as [Gender, string][]).map(([v, l]) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, gender === v && styles.chipActive]}
                    onPress={() => setGender(v)}
                  >
                    <Text style={[styles.chipText, gender === v && styles.chipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Năm sinh</Text>
              <TextInput
                style={styles.input}
                placeholder="1990"
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, !name && styles.btnDisabled]}
              onPress={() => name && setStep(3)}
              disabled={!name}
            >
              <Text style={styles.btnText}>Tiếp theo →</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(3)} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Body stats ── */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.stepLabel}>BƯỚC 2/2</Text>
            <Text style={styles.title}>Chỉ số cơ thể</Text>
            <Text style={styles.subtitle}>Để tính TDEE (nhu cầu calo hàng ngày)</Text>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Chiều cao (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="170"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Cân nặng (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="65"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="decimal-pad"
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

            <TouchableOpacity
              style={[styles.btn, createProfile.isPending && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={createProfile.isPending}
            >
              {createProfile.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Hoàn tất ✓</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCreate} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua, điền sau</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 4: Result ── */}
        {step === 4 && createProfile.data && (
          <View style={styles.section}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={72} color="#2ECC71" />
            </View>
            <Text style={styles.title}>Hồ sơ đã tạo!</Text>

            {createProfile.data.tdeeKcal && (
              <View style={styles.tdeeCard}>
                <Text style={styles.tdeeTitle}>TDEE của bạn</Text>
                <Text style={styles.tdeeValue}>{Math.round(createProfile.data.tdeeKcal)}</Text>
                <Text style={styles.tdeeUnit}>kcal/ngày</Text>
                <Text style={styles.tdeeNote}>
                  Đây là lượng calo bạn cần để duy trì cân nặng hiện tại
                </Text>
              </View>
            )}

            {createProfile.data.nutritionTargets && (
              <View style={styles.macroRow}>
                {[
                  { label: 'Protein', key: 'protein_g', color: '#3B82F6' },
                  { label: 'Carbs',   key: 'carbs_g',   color: '#F59E0B' },
                  { label: 'Fat',     key: 'fat_g',     color: '#EF4444' },
                ].map((m) => (
                  <View key={m.label} style={[styles.macroCard, { borderTopColor: m.color }]}>
                    <Text style={[styles.macroVal, { color: m.color }]}>
                      {(createProfile.data.nutritionTargets as any)[m.key]}g
                    </Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.btnText}>Vào trang chính →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#F0FDF4', marginTop: 8 }]}
              onPress={() => router.push('/family/create')}
            >
              <Text style={[styles.btnText, { color: '#2ECC71' }]}>
                + Tạo gia đình ngay
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progressBar: { height: 3, backgroundColor: '#E5E7EB' },
  progressFill: { height: 3, backgroundColor: '#2ECC71' },
  back: { padding: 16 },
  section: { paddingHorizontal: 24, paddingTop: 16, gap: 20 },
  stepLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: -8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: -12, lineHeight: 20 },

  welcomeIcon: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  features: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 24, width: 36 },
  featureText: { fontSize: 15, color: '#374151', flex: 1 },

  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#111827', backgroundColor: '#F9FAFB',
  },
  row: { flexDirection: 'row' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  chipActive: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#2ECC71' },

  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
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

  btn: {
    backgroundColor: '#2ECC71', padding: 17, borderRadius: 14, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { fontSize: 14, color: '#9CA3AF' },

  successIcon: { alignItems: 'center', paddingTop: 32, paddingBottom: 8 },
  tdeeCard: {
    backgroundColor: '#F0FDF4', borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 2, borderColor: '#BBF7D0',
  },
  tdeeTitle: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  tdeeValue: { fontSize: 56, fontWeight: '900', color: '#2ECC71', lineHeight: 64 },
  tdeeUnit: { fontSize: 16, color: '#2ECC71', fontWeight: '600' },
  tdeeNote: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroCard: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
  },
  macroVal: { fontSize: 22, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
