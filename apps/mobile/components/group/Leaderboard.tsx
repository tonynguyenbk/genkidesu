import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';

export interface LeaderboardEntry {
  profileId: string;
  displayName: string;
  isMe: boolean;
  role: 'leader' | 'member';
  rank: number;
  streak: number;
  logDays7: number;
  onTargetDays7: number;
}

// Top-3 rank tints, SF-style (gold / silver / bronze) instead of emoji medals
const RANK_COLORS = ['#FFB300', '#9BA3AE', '#C77B3F'];

// Effort-based community ranking: streaks and goal-days only — never raw
// calories or weight (privacy + doesn't reward under-eating).
export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      {entries.map((e) => (
        <View
          key={e.profileId}
          style={[styles.row, e.isMe && { backgroundColor: theme.colors.surfaceAlt }]}
        >
          <Text style={[styles.rank, e.rank <= 3 && { color: RANK_COLORS[e.rank - 1] }]}>
            {e.rank}
          </Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name} numberOfLines={1}>
                {e.displayName}
                {e.isMe && <Text style={styles.meSuffix}> · bạn</Text>}
              </Text>
              {e.role === 'leader' && <Text style={styles.leaderBadge}>chủ nhóm</Text>}
            </View>
            <Text style={styles.sub}>
              {e.logDays7}/7 ngày ghi log · {e.onTargetDays7} ngày đạt mục tiêu
            </Text>
          </View>
          <View style={styles.streakBox}>
            {e.streak > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="flame" size={15} color={theme.colors.warning} />
                <Text style={[styles.streakVal, { color: theme.colors.warning }]}>{e.streak}</Text>
              </View>
            ) : (
              <Text style={[styles.streakVal, { color: theme.colors.textTertiary }]}>—</Text>
            )}
            <Text style={styles.streakLabel}>streak</Text>
          </View>
        </View>
      ))}
      {entries.length === 0 && (
        <Text style={styles.empty}>Chưa có thành viên nào ghi log — hãy là người đầu tiên!</Text>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 16, backgroundColor: theme.colors.surface,
      borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.divider,
    },
    rank: { fontSize: 17, width: 30, textAlign: 'center', color: theme.colors.textSecondary, fontWeight: '700', fontVariant: ['tabular-nums'] },
    name: { fontSize: 17, fontWeight: '600', color: theme.colors.text, flexShrink: 1 },
    meSuffix: { fontWeight: '400', color: theme.colors.textSecondary },
    leaderBadge: {
      fontSize: 11, color: theme.colors.warning, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    sub: { fontSize: 13.5, color: theme.colors.textTertiary, marginTop: 2 },
    streakBox: { alignItems: 'center', minWidth: 52 },
    streakVal: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
    streakLabel: { fontSize: 11, color: theme.colors.textTertiary, textTransform: 'uppercase' },
    empty: { padding: 20, fontSize: 15, color: theme.colors.textTertiary, textAlign: 'center' },
  });
}
