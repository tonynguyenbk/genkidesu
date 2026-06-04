import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

type ProfileType = 'adult' | 'baby' | 'teen' | 'senior';
type Gender = 'male' | 'female' | 'other';

export default function CreateProfileScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type] = useState<ProfileType>('adult');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState(2);

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      setStep(4);
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleSubmit = () => {
    createProfile.mutate({
      name,
      type,
      gender,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      activityLevel,
    });
  };

  const activityLabels = ['Ít vận động', 'Vận động nhẹ', 'Vận động vừa', 'Vận động nhiều', 'Rất nhiều'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.back}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.progress}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
          ))}
        </View>

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.title}>Chào mừng đến Genki!</Text>
            <Text style={styles.subtitle}>Hãy tạo hồ sơ đầu tiên của bạn</Text>
            <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Bắt đầu →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.title}>Thông tin cơ bản</Text>
            <Text style={styles.label}>Tên của bạn</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" autoFocus />
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.row}>
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.btn, !name && styles.btnDisabled]} onPress={() => name && setStep(3)}>
              <Text style={styles.btnText}>Tiếp tục →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.title}>Chỉ số cơ thể</Text>
            <Text style={styles.label}>Chiều cao (cm)</Text>
            <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="170" />
            <Text style={styles.label}>Cân nặng (kg)</Text>
            <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="65" />
            <Text style={styles.label}>Mức độ vận động</Text>
            {activityLabels.map((label, i) => (
              <TouchableOpacity key={i} style={styles.radioRow} onPress={() => setActivityLevel(i + 1)}>
                <View style={[styles.radio, activityLevel === i + 1 && styles.radioActive]} />
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={createProfile.isPending}>
              {createProfile.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Hoàn tất →</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && createProfile.data && (
          <View style={styles.section}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.title}>Hồ sơ đã tạo!</Text>
            {createProfile.data.tdeeKcal && (
              <View style={styles.tdeeBox}>
                <Text style={styles.tdeeValue}>{Math.round(createProfile.data.tdeeKcal)} kcal/ngày</Text>
                <Text style={styles.tdeeLabel}>TDEE của bạn</Text>
              </View>
            )}
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.btnText}>Vào trang chính →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  back: { padding: 16 },
  backText: { color: '#2ECC71', fontSize: 16 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#2ECC71' },
  section: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#fff' },
  chipActive: { borderColor: '#2ECC71', backgroundColor: '#F0FDF4' },
  chipText: { color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#2ECC71' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB' },
  radioActive: { borderColor: '#2ECC71', backgroundColor: '#2ECC71' },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successIcon: { fontSize: 64, textAlign: 'center' },
  tdeeBox: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 24, alignItems: 'center' },
  tdeeValue: { fontSize: 32, fontWeight: '700', color: '#2ECC71' },
  tdeeLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
