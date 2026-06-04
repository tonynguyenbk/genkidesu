import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>元気</Text>
        <Text style={styles.tagline}>Khoẻ mỗi ngày</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnGoogle]}>
          <Text style={styles.btnText}>🔵  Tiếp tục với Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnApple]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>⚫  Tiếp tục với Apple</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>─────── hoặc ───────</Text>

        <TouchableOpacity
          style={[styles.btn, styles.btnPhone]}
          onPress={() => router.push('/(auth)/phone-otp')}
        >
          <Text style={styles.btnText}>📱  Đăng nhập bằng Số điện thoại</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        Bằng việc tiếp tục, bạn đồng ý với {'\n'}
        Điều khoản sử dụng & Chính sách bảo mật
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9', justifyContent: 'space-between', padding: 24 },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 72, marginBottom: 8 },
  tagline: { fontSize: 20, color: '#2ECC71', fontWeight: '600' },
  buttons: { gap: 12 },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  btnGoogle: { borderColor: '#4285F4' },
  btnApple: { backgroundColor: '#000', borderColor: '#000' },
  btnPhone: { borderColor: '#2ECC71' },
  btnText: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  divider: { textAlign: 'center', color: '#9CA3AF', marginVertical: 4 },
  terms: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24 },
});
