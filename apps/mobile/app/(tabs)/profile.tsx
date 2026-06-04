import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>👤 Hồ sơ</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/profile/create')}>
        <Text style={styles.btnText}>+ Tạo hồ sơ mới</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={logout}>
        <Text style={styles.btnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 24 },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnDanger: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
