import { View, Text, StyleSheet } from 'react-native';
import type { Theme } from '@genki/ui';
import { useThemedStyles } from '../../contexts/ThemeContext';

// Three at-a-glance stat cards: total group kcal, members on target, total meals.
export function SummaryBand({ totalKcal, membersOnTarget, memberCount, totalMeals }: {
  totalKcal: number;
  membersOnTarget: number;
  memberCount: number;
  totalMeals: number;
}) {
  const styles = useThemedStyles(createStyles);
  const cards = [
    { label: 'Tổng calo nhóm', value: totalKcal.toLocaleString(), unit: 'kcal' },
    { label: 'Đạt mục tiêu', value: `${membersOnTarget}/${memberCount}`, unit: 'người' },
    { label: 'Bữa ăn hôm nay', value: String(totalMeals), unit: 'bữa' },
  ];
  return (
    <View style={styles.band}>
      {cards.map((c) => (
        <View key={c.label} style={styles.card}>
          <Text style={styles.value}>
            {c.value}
            <Text style={styles.unit}> {c.unit}</Text>
          </Text>
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

// HIG stat band: flat white cards on the grouped background, left-aligned
// tabular numbers, no shadows (elevation is not part of the iOS language).
function createStyles(theme: Theme) {
  return StyleSheet.create({
    band: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    card: {
      flex: 1, backgroundColor: theme.colors.surface, borderRadius: 12,
      paddingVertical: 10, paddingHorizontal: 12,
    },
    value: {
      fontSize: 22, fontWeight: '700', color: theme.colors.text,
      letterSpacing: -0.3, fontVariant: ['tabular-nums'],
    },
    unit: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
    label: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  });
}
