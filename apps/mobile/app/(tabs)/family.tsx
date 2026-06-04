import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function FamilyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>👨‍👩‍👧‍👦 Gia đình</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/family/create')}>
          <Text style={styles.btnText}>+ Tạo gia đình</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/family/join')}>
          <Text style={[styles.btnText, { color: '#2ECC71' }]}>Tham gia bằng mã</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 24 },
  actions: { gap: 12 },
  btn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2ECC71' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
