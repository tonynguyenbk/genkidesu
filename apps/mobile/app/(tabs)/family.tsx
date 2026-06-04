import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MEMBERS = [
  { name: 'Tôi (Minh)', type: 'adult', cal: 680, goal: 1920, avatar: 'M', color: '#2ECC71' },
  { name: 'Vợ (Linh)', type: 'adult', cal: 1240, goal: 1600, avatar: 'L', color: '#8B5CF6' },
  { name: 'Bé An', type: 'baby', cal: 450, goal: 1000, avatar: 'A', color: '#EC4899' },
  { name: 'Bà Nội', type: 'senior', cal: 920, goal: 1500, avatar: 'B', color: '#F59E0B' },
];

const TYPE_LABELS: Record<string, string> = {
  adult: 'Người lớn', baby: 'Em bé', teen: 'Thiếu niên', senior: 'Người cao tuổi',
};

function MemberCard({ member }: { member: typeof MEMBERS[0] }) {
  const pct = Math.round((member.cal / member.goal) * 100);
  return (
    <View style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: member.color + '20' }]}>
        <Text style={[styles.memberAvatarText, { color: member.color }]}>{member.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={[styles.memberCal, { color: member.color }]}>{member.cal} kcal</Text>
        </View>
        <Text style={styles.memberType}>{TYPE_LABELS[member.type]}</Text>
        <View style={styles.memberBar}>
          <View style={[styles.memberBarFill, { width: `${pct}%` as any, backgroundColor: member.color }]} />
        </View>
        <Text style={styles.memberPct}>{pct}% mục tiêu</Text>
      </View>
    </View>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gia đình Nguyễn</Text>
            <Text style={styles.sub}>4 thành viên • Hôm nay</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="person-add-outline" size={18} color="#2ECC71" />
          </TouchableOpacity>
        </View>

        {/* Alert card */}
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Bé An thiếu canxi</Text>
            <Text style={styles.alertSub}>3 ngày liên tiếp dưới mức khuyến nghị</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
          {MEMBERS.map((m) => <MemberCard key={m.name} member={m} />)}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/family/create')}>
            <Ionicons name="home-outline" size={20} color="#2ECC71" />
            <Text style={styles.actionText}>Tạo gia đình</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSec]} onPress={() => router.push('/family/join')}>
            <Ionicons name="link-outline" size={20} color="#6B7280" />
            <Text style={[styles.actionText, { color: '#6B7280' }]}>Tham gia</Text>
          </TouchableOpacity>
        </View>

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
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 14, marginHorizontal: 16, marginBottom: 16,
    padding: 14, borderWidth: 1, borderColor: '#FDE68A',
  },
  alertIcon: { fontSize: 22 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  alertSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  section: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  memberCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  memberAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  memberAvatarText: { fontSize: 18, fontWeight: '700' },
  memberName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  memberCal: { fontSize: 13, fontWeight: '700' },
  memberType: { fontSize: 11, color: '#9CA3AF', marginTop: 1, marginBottom: 6 },
  memberBar: {
    height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden', marginBottom: 3,
  },
  memberBarFill: { height: 4, borderRadius: 2 },
  memberPct: { fontSize: 11, color: '#9CA3AF' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0FDF4', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#2ECC71',
  },
  actionBtnSec: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#2ECC71' },
});
