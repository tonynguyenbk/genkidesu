import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function StatCard({ label, value, unit, icon, color, change }: {
  label: string; value: string; unit: string; icon: string; color: string; change?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statUnit}>{unit}</Text>
        </View>
      </View>
      {change && <Text style={styles.statChange}>{change}</Text>}
    </View>
  );
}

function WeekBar({ day, pct, active }: { day: string; pct: number; active: boolean }) {
  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${pct}%` as any, backgroundColor: active ? '#2ECC71' : '#D1FAE5' }]} />
      </View>
      <Text style={[styles.barDay, active && { color: '#2ECC71', fontWeight: '700' }]}>{day}</Text>
    </View>
  );
}

const WEEK = [
  { day: 'T2', pct: 82 }, { day: 'T3', pct: 95 }, { day: 'T4', pct: 60 },
  { day: 'T5', pct: 75 }, { day: 'T6', pct: 88 }, { day: 'T7', pct: 45 },
  { day: 'CN', pct: 35, active: true },
];

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <Text style={styles.sub}>7 ngày qua</Text>
        </View>

        {/* Weekly chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calories theo tuần</Text>
          <Text style={styles.cardSub}>Trung bình: 1,740 kcal/ngày</Text>
          <View style={styles.barChart}>
            {WEEK.map((d) => (
              <WeekBar key={d.day} day={d.day} pct={d.pct} active={'active' in d && !!d.active} />
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tuần này</Text>
          <StatCard label="Calories trung bình" value="1,740" unit="kcal" icon="🔥" color="#F59E0B" change="↑ 5%" />
          <StatCard label="Protein" value="68" unit="g/ngày" icon="💪" color="#3B82F6" change="↓ 3%" />
          <StatCard label="Nước uống" value="1.8" unit="L/ngày" icon="💧" color="#06B6D4" />
          <StatCard label="Bước chân" value="7,240" unit="bước" icon="👟" color="#8B5CF6" change="↑ 12%" />
        </View>

        {/* Streak */}
        <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 36 }}>🔥</Text>
            <View>
              <Text style={styles.streakNum}>7 ngày</Text>
              <Text style={styles.streakLabel}>chuỗi ghi nhận liên tiếp</Text>
            </View>
            <Ionicons name="trophy" size={28} color="#F59E0B" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 16 },
  barChart: { flexDirection: 'row', gap: 6, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    width: '100%', height: 100, backgroundColor: '#F3F4F6', borderRadius: 6,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barDay: { fontSize: 11, color: '#9CA3AF' },
  section: { paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statIcon: { fontSize: 24 },
  statLabel: { fontSize: 12, color: '#9CA3AF' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statUnit: { fontSize: 12, color: '#9CA3AF' },
  statChange: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  streakNum: { fontSize: 22, fontWeight: '800', color: '#2ECC71' },
  streakLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
