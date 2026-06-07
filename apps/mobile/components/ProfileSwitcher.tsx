import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc } from '../lib/trpc';
import { useRouter } from 'expo-router';

const TYPE_COLORS: Record<string, string> = {
  adult: '#2ECC71', senior: '#F59E0B', teen: '#8B5CF6', baby: '#EC4899',
};

const TYPE_ICONS: Record<string, string> = {
  adult: '👤', senior: '👴', teen: '🧑', baby: '👶',
};

interface Profile {
  id: string;
  name: string;
  type: string;
  tdeeKcal: number | null;
}

interface Props {
  activeProfile: Profile | null;
}

export function ProfileSwitcher({ activeProfile }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const profiles = trpc.profile.list.useQuery(undefined, { retry: false });

  const color = TYPE_COLORS[activeProfile?.type ?? 'adult'] ?? '#2ECC71';
  const initial = activeProfile?.name?.[0]?.toUpperCase() ?? 'G';

  return (
    <>
      <TouchableOpacity
        style={[styles.avatar, { backgroundColor: color }]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.avatarText}>{initial}</Text>
        {(profiles.data?.length ?? 0) > 1 && (
          <View style={styles.badge}>
            <Ionicons name="chevron-down" size={8} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Chuyển hồ sơ</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={profiles.data ?? []}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => {
                const pColor = TYPE_COLORS[item.type] ?? '#2ECC71';
                const isActive = item.id === activeProfile?.id;
                return (
                  <TouchableOpacity
                    style={[styles.profileRow, isActive && styles.profileRowActive]}
                    onPress={() => setOpen(false)}
                  >
                    <View style={[styles.profileAvatar, { backgroundColor: pColor + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{TYPE_ICONS[item.type] ?? '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileName}>{item.name}</Text>
                      <Text style={styles.profileType}>
                        {item.type === 'adult' ? 'Người lớn' : item.type === 'senior' ? 'Người cao tuổi' : item.type === 'teen' ? 'Thanh thiếu niên' : 'Em bé'}
                        {item.tdeeKcal ? ` · ${Math.round(item.tdeeKcal)} kcal` : ''}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addProfile}
                  onPress={() => { setOpen(false); router.push('/profile/create'); }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#2ECC71" />
                  <Text style={styles.addProfileText}>Thêm hồ sơ mới</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  badge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#111827', borderRadius: 8,
    width: 14, height: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  profileRowActive: { backgroundColor: '#F0FDF4' },
  profileAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  profileName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  profileType: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  addProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  addProfileText: { fontSize: 15, color: '#2ECC71', fontWeight: '600' },
});
