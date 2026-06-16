import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Theme } from '@genki/ui';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

const TYPE_COLORS: Record<string, string> = {
  adult: '#2ECC71', senior: '#F59E0B', teen: '#8B5CF6', baby: '#EC4899',
};

const TYPE_ICONS: Record<string, string> = {
  adult: '👤', senior: '👴', teen: '🧑', baby: '👶',
};

export function ProfileSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { activeProfile, setActiveProfile, profiles } = useActiveProfile();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const color = TYPE_COLORS[activeProfile?.type ?? 'adult'] ?? '#2ECC71';
  // Normalize to ASCII so Vietnamese diacritics (Ô, Ă, Đ…) don't render as
  // ambiguous glyphs at small sizes inside the avatar circle.
  const initial = (activeProfile?.name?.[0] ?? 'G')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { borderColor: color + '30', backgroundColor: color + '10' }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={[styles.triggerName, { color: color }]} numberOfLines={1}>
          {activeProfile?.name ?? 'Hồ sơ'}
        </Text>
        <Ionicons name="chevron-down" size={13} color={color} />
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
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={profiles}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => {
                const pColor = TYPE_COLORS[item.type] ?? '#2ECC71';
                const isActive = item.id === activeProfile?.id;
                return (
                  <TouchableOpacity
                    style={[styles.profileRow, isActive && styles.profileRowActive]}
                    onPress={() => { setActiveProfile(item.id); setOpen(false); }}
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
                    {isActive && <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addProfile}
                  onPress={() => { setOpen(false); router.push('/profile/create'); }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      paddingVertical: 6, paddingLeft: 6, paddingRight: 10,
      borderRadius: 24, borderWidth: 1.5,
      maxWidth: 160,
    },
    triggerName: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
    avatar: {
      width: 30, height: 30, borderRadius: 15,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    overlay: {
      flex: 1, backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingBottom: 32, maxHeight: '70%',
    },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    profileRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    profileRowActive: { backgroundColor: theme.colors.surfaceAlt },
    profileAvatar: {
      width: 46, height: 46, borderRadius: 23,
      justifyContent: 'center', alignItems: 'center',
    },
    profileName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    profileType: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    addProfile: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 16,
    },
    addProfileText: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },
  });
}
