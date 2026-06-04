import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const listProfiles = trpc.profile.list.useQuery();
  const joinFamily = trpc.family.join.useMutation({
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã tham gia gia đình!');
      router.replace('/(tabs)/family');
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleJoin = () => {
    const firstProfile = listProfiles.data?.[0];
    if (!firstProfile) return Alert.alert('Lỗi', 'Cần tạo hồ sơ trước');
    joinFamily.mutate({ inviteCode: code.toUpperCase(), profileId: firstProfile.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Tham gia gia đình</Text>
        <Text style={styles.subtitle}>Nhập mã 8 ký tự từ người mời</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: GENKI123"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoFocus
        />
        <TouchableOpacity
          style={[styles.btn, code.length < 8 && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={code.length < 8 || joinFamily.isPending}
        >
          {joinFamily.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Tham gia</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  back: { padding: 16 },
  backText: { color: '#2ECC71', fontSize: 16 },
  content: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 16, fontSize: 24, backgroundColor: '#fff',
    textAlign: 'center', letterSpacing: 8, fontWeight: '700', color: '#2ECC71',
  },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
