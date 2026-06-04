import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>元気 Genki</Text>
      <Text style={styles.subtitle}>Chào mừng! Hôm nay bạn ăn gì?</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📊 Dashboard sẽ hiện ở đây</Text>
        <Text style={styles.note}>Sprint 0 — Placeholder</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16,
    borderStyle: 'dashed', marginTop: 24,
  },
  placeholderText: { fontSize: 18, color: '#9CA3AF' },
  note: { fontSize: 12, color: '#D1D5DB', marginTop: 8 },
});
