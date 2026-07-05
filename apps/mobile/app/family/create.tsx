import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

type GroupType = 'family' | 'community';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TEMPLATES: { type: GroupType; icon: IoniconName; title: string; desc: string; hint: string }[] = [
  {
    type: 'family',
    icon: 'home-outline',
    title: 'Gia đình',
    desc: 'Ăn chung mâm cơm, chăm sóc con nhỏ và bố mẹ',
    hint: 'Thành viên thấy bữa ăn của nhau · tối đa 10 hồ sơ',
  },
  {
    type: 'community',
    icon: 'earth-outline',
    title: 'Cộng đồng',
    desc: 'Cùng nhau đạt mục tiêu: gym, giảm cân, mẹ bỉm sữa...',
    hint: 'Riêng tư mặc định, thi đua streak · tối đa 500 người',
  },
];

// Colored initial circle per profile type (same avatar pattern as MemberCard)
const TYPE_COLORS: Record<string, string> = {
  adult: '#5AC8FA', baby: '#FF6482', teen: '#BF5AF2', senior: '#FF9F0A',
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [type, setType] = useState<GroupType | null>(null);
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inviteCode, setInviteCode] = useState('');

  const { activeProfile, profiles } = useActiveProfile();
  const utils = trpc.useUtils();
  const createGroup = trpc.family.create.useMutation({
    onSuccess: (data) => {
      utils.family.list.invalidate();
      setInviteCode(data.inviteCode);
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const toggleProfile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!type || !name) return;
    // Family: every ticked profile joins together. Community: just the active one.
    const profileIds = type === 'family' && selectedIds.size > 0
      ? [...selectedIds]
      : activeProfile ? [activeProfile.id] : undefined;
    createGroup.mutate({ name, type, profileIds });
  };

  const placeholder = type === 'community'
    ? 'VD: Hội Gym Khỏe Mỗi Ngày, CLB Giảm Cân...'
    : 'VD: Nhà Nguyễn, Gia đình Minh...';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => (type && !inviteCode ? setType(null) : router.back())}
        style={styles.back}
      >
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 1: pick a template */}
        {!type && (
          <>
            <Text style={styles.title}>Tạo nhóm mới</Text>
            <Text style={styles.subtitle}>Bạn muốn tạo nhóm kiểu nào?</Text>
            {TEMPLATES.map((t) => (
              <TouchableOpacity key={t.type} style={styles.templateCard} onPress={() => setType(t.type)}>
                <View style={styles.templateGlyph}>
                  <Ionicons name={t.icon} size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateTitle}>{t.title}</Text>
                  <Text style={styles.templateDesc}>{t.desc}</Text>
                  <Text style={styles.templateHint}>{t.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step 2: name (+ profile picker for family) */}
        {type && !inviteCode && (
          <>
            <Text style={styles.title}>
              {type === 'family' ? 'Nhóm gia đình' : 'Nhóm cộng đồng'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            {type === 'family' && profiles.length > 1 && (
              <>
                <Text style={styles.sectionTitle}>Hồ sơ nào tham gia cùng?</Text>
                {profiles.map((p) => {
                  const selected = selectedIds.has(p.id) || (selectedIds.size === 0 && p.id === activeProfile?.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.profileRow, selected && styles.profileRowSelected]}
                      onPress={() => toggleProfile(p.id)}
                    >
                      <View style={[styles.avatar, { backgroundColor: TYPE_COLORS[p.type] ?? '#5AC8FA' }]}>
                        <Text style={styles.avatarInitial}>{p.name[0]?.toUpperCase() ?? '?'}</Text>
                      </View>
                      <Text style={styles.profileName}>{p.name}</Text>
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selected ? theme.colors.primary : theme.colors.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {type === 'community' && (
              <Text style={styles.note}>
                Bạn sẽ tham gia bằng hồ sơ "{activeProfile?.name ?? 'chính'}". Bảng xếp hạng chỉ hiện chuỗi ngày ghi log — không lộ chi tiết bữa ăn.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.btn, !name && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={!name || createGroup.isPending}
            >
              {createGroup.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Tạo ngay</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: success + invite code */}
        {inviteCode && (
          <>
            <View style={styles.successGlyph}>
              <Ionicons name="checkmark-circle" size={56} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Nhóm đã tạo!</Text>
            <Text style={styles.subtitle}>
              {type === 'community'
                ? 'Chia sẻ mã này lên group chat để mời mọi người'
                : 'Chia sẻ mã này để mời thành viên gia đình'}
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => Clipboard.setStringAsync(inviteCode)}>
              <Ionicons name="copy-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.btnText, { color: theme.colors.primary }]}>Sao chép mã</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/group' as any)}>
              <Text style={styles.btnText}>Xem nhóm →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    back: { padding: 16 },
    backText: { color: theme.colors.primary, fontSize: 16 },
    content: { padding: 24, paddingTop: 0, gap: 16 },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginTop: 4 },
    templateCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    templateGlyph: {
      width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center',
    },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 14, fontWeight: '700' },
    successGlyph: { alignItems: 'center' },
    templateTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    templateDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    templateHint: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 6 },
    input: {
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      padding: 16, fontSize: 16, backgroundColor: theme.colors.surface, color: theme.colors.text,
    },
    profileRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    profileRowSelected: { borderColor: theme.colors.primary },
    profileName: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
    note: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
    btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    btnDisabled: { backgroundColor: theme.colors.textTertiary },
    btnSecondary: {
      backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12,
      flexDirection: 'row', gap: 8,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    codeBox: { backgroundColor: theme.colors.surfaceAlt, padding: 24, borderRadius: 16, alignItems: 'center' },
    code: { fontSize: 32, fontWeight: '700', color: theme.colors.primary, letterSpacing: 8 },
  });
}
