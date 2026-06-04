import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📊 Thống kê dinh dưỡng</Text>
      <View style={styles.placeholder}>
        <Text style={styles.text}>Biểu đồ sẽ hiện ở đây</Text>
        <Text style={styles.note}>Sprint 3 — Analytics</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, borderStyle: 'dashed', marginTop: 24 },
  text: { fontSize: 18, color: '#9CA3AF' },
  note: { fontSize: 12, color: '#D1D5DB', marginTop: 8 },
});
