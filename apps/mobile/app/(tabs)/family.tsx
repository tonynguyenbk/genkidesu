import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { trpc } from '../../lib/trpc';

const TYPE_COLORS: Record<string, string> = {
  adult: '#2ECC71', senior: '#F59E0B', teen: '#8B5CF6', baby: '#EC4899',
};
const TYPE_LABELS: Record<string, string> = {
  adult: 'Người lớn', baby: 'Em bé', teen: 'Thiếu niên', senior: 'Người cao tuổi',
};

function MemberCard({ member }: { member: Record<string, any> }) {
  const profile = member.profile as Record<string, any>;
  const color = TYPE_COLORS[profile.type as string] ?? '#2ECC71';
  const todaySummary = (profile.dailySummaries as any[])?.[0];
  const caloriesEaten = (todaySummary?.totalCalories as number) ?? 0;
  const caloriesGoal =
    (profile.nutritionTargets as any)?.calories ?? (profile.tdeeKcal as number) ?? 1800;
  const pct = caloriesGoal > 0 ? Math.min(Math.round((caloriesEaten / caloriesGoal) * 100), 100) : 0;
  const initial = (profile.name as string)?.[0]?.toUpperCase() ?? '?';
  const isPrivate = (member.privacySettings as any)?.show_details_to_family === false;

  return (
    <View style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.memberAvatarText, { color }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.memberTop}>
          <Text style={styles.memberName}>{profile.name as string}</Text>
          {isPrivate
            ? <Text style={styles.privateLabel}>🔒</Text>
            : <Text style={[styles.memberCal, { color }]}>{Math.round(caloriesEaten)} kcal</Text>
          }
        </View>
        <Text style={styles.memberType}>
          {TYPE_LABELS[profile.type as string] ?? (profile.type as string)}
          {(member.role as string) === 'owner' ? ' · Trưởng nhóm' : ''}
        </Text>
        {!isPrivate && (
          <>
            <View style={styles.memberBar}>
              <View style={[styles.memberBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={styles.memberPct}>{pct}% · mục tiêu {Math.round(caloriesGoal)} kcal</Text>
          </>
        )}
      </View>
    </View>
  );
}

function EmptyState() {
  const router = useRouter();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
      <Text style={styles.emptyTitle}>Chưa có gia đình</Text>
      <Text style={styles.emptySub}>Tạo nhóm để theo dõi dinh dưỡng cùng cả nhà</Text>
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/family/create')}>
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.createBtnText}>Tạo gia đình</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/family/join')}>
        <Ionicons name="link-outline" size={18} color="#2ECC71" />
        <Text style={styles.joinBtnText}>Tham gia bằng mã mời</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const families = trpc.family.list.useQuery(undefined, { retry: false });
  const family = families.data?.[0];

  const dashboard = trpc.family.getDashboard.useQuery(
    { familyId: family?.id ?? '' },
    { enabled: !!family?.id },
  );

  const handleCopyCode = async () => {
    if (!family?.inviteCode) return;
    await Clipboard.setStringAsync(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (families.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2ECC71" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!family ? (
          <EmptyState />
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{family.name}</Text>
                <Text style={styles.sub}>
                  {dashboard.data?.members.length ?? '–'} thành viên · Hôm nay
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/profile/create')}
              >
                <Ionicons name="person-add-outline" size={18} color="#2ECC71" />
              </TouchableOpacity>
            </View>

            {/* Invite code banner */}
            <TouchableOpacity style={styles.inviteBanner} onPress={handleCopyCode} activeOpacity={0.8}>
              <View>
                <Text style={styles.inviteLabel}>Mã mời gia đình</Text>
                <Text style={styles.inviteCode}>{family.inviteCode}</Text>
              </View>
              <View style={styles.copyChip}>
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copied ? '#2ECC71' : '#6B7280'}
                />
                <Text style={[styles.copyText, copied && { color: '#2ECC71' }]}>
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
              {dashboard.isLoading ? (
                <ActivityIndicator color="#2ECC71" style={{ marginVertical: 24 }} />
              ) : dashboard.data?.members.length === 0 ? (
                <Text style={styles.noMembers}>Chưa có thành viên nào</Text>
              ) : (
                dashboard.data?.members.map((m) => (
                  <MemberCard key={m.id} member={m as Record<string, any>} />
                ))
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/family/join')}
              >
                <Ionicons name="link-outline" size={18} color="#2ECC71" />
                <Text style={styles.actionText}>Mời thành viên</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSec]}
                onPress={() => router.push('/family/create')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#6B7280" />
                <Text style={[styles.actionText, { color: '#6B7280' }]}>Tạo nhóm mới</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
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
  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FDF4', borderRadius: 16, marginHorizontal: 16, marginBottom: 20,
    padding: 16, borderWidth: 1, borderColor: '#BBF7D0',
  },
  inviteLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  inviteCode: { fontSize: 24, fontWeight: '800', color: '#2ECC71', letterSpacing: 6 },
  copyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
  },
  copyText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  section: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  noMembers: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
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
  memberTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  memberCal: { fontSize: 13, fontWeight: '700' },
  privateLabel: { fontSize: 14 },
  memberType: { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginBottom: 6 },
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
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2ECC71', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginTop: 8, width: '100%',
    shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, width: '100%', borderWidth: 1, borderColor: '#2ECC71',
  },
  joinBtnText: { color: '#2ECC71', fontSize: 15, fontWeight: '600' },
});
