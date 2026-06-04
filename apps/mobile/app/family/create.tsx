import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { trpc } from '../../lib/trpc';

export default function CreateFamilyScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const createFamily = trpc.family.create.useMutation({
    onSuccess: (data) => setInviteCode(data.inviteCode),
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        {!inviteCode ? (
          <>
            <Text style={styles.title}>Tạo gia đình</Text>
            <TextInput
              style={styles.input}
              placeholder="Gia đình Nguyễn"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, !name && styles.btnDisabled]}
              onPress={() => name && createFamily.mutate({ name })}
              disabled={createFamily.isPending}
            >
              {createFamily.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Tạo ngay</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.title}>Gia đình đã tạo!</Text>
            <Text style={styles.subtitle}>Chia sẻ mã này để mời thành viên</Text>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => Clipboard.setStringAsync(inviteCode)}>
              <Text style={[styles.btnText, { color: '#2ECC71' }]}>📋  Sao chép mã</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/family')}>
              <Text style={styles.btnText}>Xem gia đình →</Text>
            </TouchableOpacity>
          </>
        )}
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
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#fff' },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnSecondary: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2ECC71' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successIcon: { fontSize: 64, textAlign: 'center' },
  codeBox: { backgroundColor: '#F0FDF4', padding: 24, borderRadius: 16, alignItems: 'center' },
  code: { fontSize: 32, fontWeight: '700', color: '#2ECC71', letterSpacing: 8 },
});
