import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#EF4444' : '#2ECC71'} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {!danger && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <Text style={styles.name}>Nguyễn Văn Minh</Text>
          <Text style={styles.email}>minh@example.com</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>👑 Pro</Text></View>
            <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.badgeText, { color: '#3B82F6' }]}>🔥 7 ngày</Text>
            </View>
          </View>
        </View>

        {/* TDEE stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'TDEE', value: '1,920', unit: 'kcal' },
            { label: 'BMI', value: '22.4', unit: '' },
            { label: 'Mục tiêu', value: 'Duy trì', unit: '' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}<Text style={styles.statUnit}> {s.unit}</Text></Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hồ sơ</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Thông tin cá nhân" onPress={() => {}} />
            <MenuItem icon="fitness-outline" label="Mục tiêu dinh dưỡng" value="1,920 kcal" onPress={() => {}} />
            <MenuItem icon="medical-outline" label="Bệnh lý & Chế độ ăn" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="notifications-outline" label="Thông báo" onPress={() => {}} />
            <MenuItem icon="shield-checkmark-outline" label="Quyền riêng tư" onPress={() => {}} />
            <MenuItem icon="language-outline" label="Ngôn ngữ" value="Tiếng Việt" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gia đình</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="people-outline" label="Quản lý gia đình" onPress={() => router.push('/(tabs)/family')} />
            <MenuItem icon="add-circle-outline" label="Tạo hồ sơ mới" onPress={() => router.push('/profile/create')} />
          </View>
        </View>

        <View style={[styles.menuCard, { marginHorizontal: 16, marginBottom: 32 }]}>
          <MenuItem icon="log-out-outline" label="Đăng xuất" danger onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  hero: {
    alignItems: 'center', paddingTop: Platform.OS === 'web' ? 32 : 16,
    paddingBottom: 24, paddingHorizontal: 20,
  },
  avatarBig: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  email: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    backgroundColor: '#F0FDF4',
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#2ECC71' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 20,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statUnit: { fontSize: 11, color: '#9CA3AF', fontWeight: '400' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, paddingLeft: 4 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEF2F2' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  menuValue: { fontSize: 13, color: '#9CA3AF' },
});
