import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useThemedStyles } from '../../contexts/ThemeContext';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const styles = useThemedStyles(createStyles);

  const { activeProfile } = useActiveProfile();
  const utils = trpc.useUtils();
  const joinFamily = trpc.family.join.useMutation({
    onSuccess: () => {
      utils.family.list.invalidate();
      Alert.alert('Thành công', 'Đã tham gia gia đình!');
      router.replace('/(tabs)/family');
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const handleJoin = () => {
    if (!activeProfile) return Alert.alert('Lỗi', 'Cần tạo hồ sơ trước');
    joinFamily.mutate({ inviteCode: code.toUpperCase(), profileId: activeProfile.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Tham gia gia đình</Text>
        <Text style={styles.subtitle}>Nhập mã 8 ký tự từ người mời</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: GENKI123"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoFocus
        />
        <TouchableOpacity
          style={[styles.btn, code.length < 8 && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={code.length < 8 || joinFamily.isPending}
        >
          {joinFamily.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Tham gia</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    back: { padding: 16 },
    backText: { color: theme.colors.primary, fontSize: 16 },
    content: { flex: 1, padding: 24, gap: 16 },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary },
    input: {
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      padding: 16, fontSize: 24, backgroundColor: theme.colors.surface,
      textAlign: 'center', letterSpacing: 8, fontWeight: '700', color: theme.colors.primary,
    },
    btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    btnDisabled: { backgroundColor: theme.colors.textTertiary },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
