import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { STATUS_COLORS, STATUS_LABELS, type MemberStatus } from '../../lib/groupStatus';

export interface DashboardMember {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  type: string;
  role: 'leader' | 'member';
  targetKcal: number;
  actualKcal: number;
  progressPct: number;
  status: MemberStatus;
  alertFlags: string[];
  macros: { proteinG: number; carbG: number; fatG: number };
  meals: { id: string; name: string; kcal: number; loggedAt: string | Date; source: 'self' | 'meal_sync' }[];
}

export function MemberCard({ member }: { member: DashboardMember }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[member.status];
  const initial = member.displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((e) => !e)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.name}>{member.displayName}</Text>
            {member.role === 'leader' && <Ionicons name="star" size={12} color={theme.colors.warning} />}
          </View>
          <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[member.status]}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.kcal}>{member.actualKcal.toLocaleString()}</Text>
          <Text style={styles.kcalSub}>/ {member.targetKcal.toLocaleString()} kcal</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textTertiary} />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(member.progressPct, 100)}%` as any, backgroundColor: color }]} />
      </View>

      {expanded && (
        <View style={styles.detail}>
          <View style={styles.macroRow}>
            {[
              { label: 'Chất đạm', val: member.macros.proteinG },
              { label: 'Tinh bột', val: member.macros.carbG },
              { label: 'Chất béo', val: member.macros.fatG },
            ].map((mac) => (
              <View key={mac.label} style={styles.macroItem}>
                <Text style={styles.macroVal}>{mac.val}g</Text>
                <Text style={styles.macroLabel}>{mac.label}</Text>
              </View>
            ))}
          </View>

          {member.meals.length === 0 ? (
            <Text style={styles.noMeal}>Chưa ghi nhận bữa ăn hôm nay</Text>
          ) : (
            member.meals.map((meal) => (
              <View key={meal.id} style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {meal.name}
                    {meal.source === 'meal_sync' && <Text style={styles.syncTag}>  (Meal Sync)</Text>}
                  </Text>
                  <Text style={styles.mealTime}>
                    {new Date(meal.loggedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    // Flat iOS card: radius 12, no shadow — surfaces separate from the grouped
    // background by tone, not elevation.
    card: {
      backgroundColor: theme.colors.surface, borderRadius: 12, marginHorizontal: 16, marginBottom: 8,
      padding: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    name: { fontSize: 17, fontWeight: '600', color: theme.colors.text },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, marginTop: 3 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    kcal: { fontSize: 18, fontWeight: '700', color: theme.colors.text, fontVariant: ['tabular-nums'] },
    kcalSub: { fontSize: 12, color: theme.colors.textSecondary, fontVariant: ['tabular-nums'] },
    track: { height: 4, backgroundColor: theme.colors.divider, borderRadius: 2, overflow: 'hidden', marginTop: 12 },
    fill: { height: 4, borderRadius: 2 },
    detail: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 12 },
    macroRow: { flexDirection: 'row', backgroundColor: theme.colors.divider, borderRadius: 10, padding: 10, marginBottom: 10 },
    macroItem: { flex: 1, alignItems: 'center' },
    macroVal: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    macroLabel: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 },
    noMeal: { fontSize: 15, color: theme.colors.textTertiary, fontStyle: 'italic', paddingVertical: 6 },
    mealRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    mealName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    syncTag: { fontSize: 12, fontWeight: '500', color: theme.colors.info },
    mealTime: { fontSize: 12.5, color: theme.colors.textTertiary, marginTop: 1 },
    mealKcal: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  });
}
