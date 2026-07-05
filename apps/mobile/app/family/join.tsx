import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

// Colored initial circle per profile type (same avatar pattern as MemberCard)
const TYPE_COLORS: Record<string, string> = {
  adult: '#5AC8FA', baby: '#FF6482', teen: '#BF5AF2', senior: '#FF9F0A',
};

export default function JoinGroupScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { activeProfile, profiles } = useActiveProfile();
  const utils = trpc.useUtils();

  const preview = trpc.family.preview.useQuery(
    { inviteCode: previewCode ?? '' },
    { enabled: !!previewCode, retry: false },
  );

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const joinGroup = trpc.family.join.useMutation({
    onSuccess: () => {
      utils.family.list.invalidate();
      notify('Thành công', 'Đã tham gia nhóm!');
      router.replace('/(tabs)/group' as any);
    },
    onError: (e) => notify('Lỗi', e.message),
  });

  const group = preview.data;
  const isFamily = group?.type === 'family';

  const toggleProfile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJoin = () => {
    if (!group) return;
    if (!activeProfile) return notify('Lỗi', 'Cần tạo hồ sơ trước');
    const profileIds = isFamily && selectedIds.size > 0
      ? [...selectedIds]
      : [activeProfile.id];
    joinGroup.mutate({ inviteCode: (previewCode ?? code).toUpperCase(), profileIds });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => (previewCode ? setPreviewCode(null) : router.back())}
        style={styles.back}
      >
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 1: enter the code */}
        {!previewCode && (
          <>
            <Text style={styles.title}>Tham gia nhóm</Text>
            <Text style={styles.subtitle}>Nhập mã 8 ký tự từ người mời</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: GENKI123"
              placeholderTextColor={theme.colors.textTertiary}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, code.length < 8 && styles.btnDisabled]}
              onPress={() => setPreviewCode(code)}
              disabled={code.length < 8}
            >
              <Text style={styles.btnText}>Tiếp tục</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: preview the group + pick profile(s) */}
        {previewCode && (
          preview.isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
          ) : preview.error ? (
            <>
              <Text style={styles.title}>Mã không hợp lệ</Text>
              <Text style={styles.subtitle}>{preview.error.message}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => setPreviewCode(null)}>
                <Text style={styles.btnText}>Nhập lại mã</Text>
              </TouchableOpacity>
            </>
          ) : group && (
            <>
              <View style={styles.groupCard}>
                <View style={styles.groupGlyph}>
                  <Ionicons name={isFamily ? 'home-outline' : 'earth-outline'} size={26} color={theme.colors.primary} />
                </View>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMeta}>
                  {isFamily ? 'Nhóm gia đình' : 'Cộng đồng'} · {group.memberCount}/{group.maxMembers} thành viên
                </Text>
              </View>

              {isFamily ? (
                <>
                  <Text style={styles.sectionTitle}>Hồ sơ nào tham gia?</Text>
                  <Text style={styles.note}>Gia đình có thể vào cùng lúc nhiều hồ sơ (bạn, con, bố mẹ...)</Text>
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
              ) : (
                <Text style={styles.note}>
                  Bạn sẽ tham gia bằng hồ sơ "{activeProfile?.name ?? 'chính'}". Cộng đồng chỉ thấy chuỗi ngày ghi log của bạn — chi tiết bữa ăn luôn riêng tư.
                </Text>
              )}

              <TouchableOpacity
                style={styles.btn}
                onPress={handleJoin}
                disabled={joinGroup.isPending}
              >
                {joinGroup.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{isFamily ? 'Tham gia cùng nhau' : 'Tham gia'}</Text>}
              </TouchableOpacity>
            </>
          )
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
    sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    input: {
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      padding: 16, fontSize: 24, backgroundColor: theme.colors.surface,
      textAlign: 'center', letterSpacing: 8, fontWeight: '700', color: theme.colors.primary,
    },
    groupCard: {
      alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface,
      borderRadius: 16, padding: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
    },
    groupGlyph: {
      width: 52, height: 52, borderRadius: 14, backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 14, fontWeight: '700' },
    groupName: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    groupMeta: { fontSize: 13, color: theme.colors.textTertiary },
    note: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
    profileRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    profileRowSelected: { borderColor: theme.colors.primary },
    profileName: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text },
    btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    btnDisabled: { backgroundColor: theme.colors.textTertiary },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
