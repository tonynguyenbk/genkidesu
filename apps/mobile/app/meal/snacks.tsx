import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { SNACK_SUBTYPES, MEAL_META } from '../../lib/mealTypes';

// Computed once at module load — recomputing per render would change the
// tRPC query key every time and trigger an infinite refetch loop.
const TODAY_ISO = new Date().toISOString();

export default function SnacksScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ profileId: string; date?: string }>();
  const dateIso = params.date ?? TODAY_ISO;

  const logsQuery = trpc.meal.getDailyLogs.useQuery(
    { profileId: params.profileId ?? '', date: dateIso },
    { enabled: !!params.profileId, retry: false },
  );

  // Per sub-type totals for today.
  const statsFor = (subType: string) => {
    const logs = (logsQuery.data ?? []).filter((l) => l.mealType === subType);
    const cals = logs.reduce((s, l) => s + l.items.reduce((is, i) => is + i.calories, 0), 0);
    const count = logs.reduce((s, l) => s + l.items.length, 0);
    return { cals, count };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bữa phụ</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.hint}>Chọn loại bữa phụ để xem và chỉnh sửa</Text>

        {logsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : (
          SNACK_SUBTYPES.map((subType) => {
            const meta = MEAL_META[subType]!;
            const { cals, count } = statsFor(subType);
            return (
              <TouchableOpacity
                key={subType}
                style={styles.card}
                onPress={() =>
                  params.profileId &&
                  router.push({ pathname: '/meal/[type]', params: { type: subType, profileId: params.profileId, date: dateIso } })
                }
              >
                <Ionicons name={meta.icon} size={24} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{meta.label}</Text>
                  <Text style={styles.cardSub}>
                    {count > 0 ? `${count} món` : 'Chưa ghi nhận'}
                  </Text>
                </View>
                {count > 0 && (
                  <Text style={styles.cardCal}>{Math.round(cals)} kcal</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    topTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    hint: { fontSize: 13, color: theme.colors.textTertiary, marginBottom: 14 },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 12,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardIcon: { fontSize: 28 },
    cardLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    cardSub: { fontSize: 13, color: theme.colors.textTertiary, marginTop: 2 },
    cardCal: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginRight: 4 },
  });
}
