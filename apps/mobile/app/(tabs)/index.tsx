import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TODAY = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
const CALORIES_GOAL = 1920;
const CALORIES_EATEN = 680;
const CALORIES_PCT = Math.round((CALORIES_EATEN / CALORIES_GOAL) * 100);

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min(current / goal, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{current}<Text style={styles.macroGoal}>/{goal}g</Text></Text>
    </View>
  );
}

function MealRow({ type, icon, calories, time }: { type: string; icon: string; calories: number | null; time: string }) {
  const empty = calories === null;
  return (
    <TouchableOpacity style={[styles.mealRow, empty && styles.mealRowEmpty]}>
      <Text style={styles.mealIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealType}>{type}</Text>
        <Text style={styles.mealTime}>{empty ? 'Chưa ghi nhận' : time}</Text>
      </View>
      {empty
        ? <Ionicons name="add-circle-outline" size={22} color="#2ECC71" />
        : <Text style={styles.mealCal}>{calories} kcal</Text>
      }
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào! 👋</Text>
            <Text style={styles.date}>{TODAY}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie Ring Card */}
        <View style={styles.card}>
          <View style={styles.ringRow}>
            <View style={styles.ringWrapper}>
              <View style={styles.ring}>
                <View style={[styles.ringProgress, { borderColor: '#2ECC71' }]} />
                <View style={styles.ringCenter}>
                  <Text style={styles.ringNumber}>{CALORIES_EATEN}</Text>
                  <Text style={styles.ringLabel}>kcal</Text>
                  <Text style={styles.ringSub}>đã ăn</Text>
                </View>
              </View>
            </View>
            <View style={styles.calStats}>
              <View style={styles.calStatRow}>
                <View style={[styles.dot, { backgroundColor: '#2ECC71' }]} />
                <Text style={styles.calStatLabel}>Mục tiêu</Text>
                <Text style={styles.calStatVal}>{CALORIES_GOAL}</Text>
              </View>
              <View style={styles.calStatRow}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.calStatLabel}>Đã ăn</Text>
                <Text style={styles.calStatVal}>{CALORIES_EATEN}</Text>
              </View>
              <View style={styles.calStatRow}>
                <View style={[styles.dot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.calStatLabel}>Còn lại</Text>
                <Text style={styles.calStatVal}>{CALORIES_GOAL - CALORIES_EATEN}</Text>
              </View>
            </View>
          </View>

          {/* Macro bars */}
          <View style={styles.macroSection}>
            <MacroBar label="Protein" current={32} goal={80} color="#3B82F6" />
            <MacroBar label="Carbs" current={85} goal={250} color="#F59E0B" />
            <MacroBar label="Fat" current={18} goal={65} color="#EF4444" />
          </View>
        </View>

        {/* Meal Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bữa ăn hôm nay</Text>
            <Text style={styles.sectionSub}>{CALORIES_PCT}% mục tiêu</Text>
          </View>
          <View style={styles.mealList}>
            <MealRow type="Bữa sáng" icon="🌅" calories={680} time="07:30 • Phở bò, Cà phê sữa" />
            <MealRow type="Bữa trưa" icon="☀️" calories={null} time="" />
            <MealRow type="Bữa chiều" icon="🌤️" calories={null} time="" />
            <MealRow type="Bữa tối" icon="🌙" calories={null} time="" />
          </View>
        </View>

        {/* Quick Log Button */}
        <TouchableOpacity style={styles.quickLog}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.quickLogText}>Chụp ảnh bữa ăn</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 8, paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ringWrapper: { marginRight: 24 },
  ring: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 10, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  ringProgress: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    borderWidth: 10, borderLeftColor: 'transparent', borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  ringCenter: { alignItems: 'center' },
  ringNumber: { fontSize: 24, fontWeight: '800', color: '#111827' },
  ringLabel: { fontSize: 11, color: '#6B7280' },
  ringSub: { fontSize: 10, color: '#9CA3AF' },
  calStats: { flex: 1, gap: 10 },
  calStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  calStatLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  calStatVal: { fontSize: 13, fontWeight: '600', color: '#111827' },

  macroSection: { gap: 8 },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroLabel: { width: 50, fontSize: 12, color: '#6B7280' },
  macroTrack: {
    flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden',
  },
  macroFill: { height: 6, borderRadius: 3 },
  macroValue: { fontSize: 12, fontWeight: '600', color: '#111827', width: 55, textAlign: 'right' },
  macroGoal: { fontSize: 10, color: '#9CA3AF', fontWeight: '400' },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 12, color: '#2ECC71', fontWeight: '600' },
  mealList: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  mealRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  mealRowEmpty: { opacity: 0.7 },
  mealIcon: { fontSize: 24, marginRight: 12 },
  mealType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  mealTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  mealCal: { fontSize: 13, fontWeight: '600', color: '#2ECC71' },

  quickLog: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2ECC71', marginHorizontal: 16,
    padding: 16, borderRadius: 16,
    shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  quickLogText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
