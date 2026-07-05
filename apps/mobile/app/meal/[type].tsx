import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../../lib/trpc';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { MEAL_META } from '../../lib/mealTypes';
import { formatMicros, sumMicros, formatMicroValue } from '../../lib/micronutrients';

// Computed once at module load — recomputing per render would change the
// tRPC query key every time and trigger an infinite refetch loop.
const TODAY_ISO = new Date().toISOString();

interface ItemRow {
  id: string;
  name: string;
  portionGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  micronutrients?: Record<string, number> | null;
  microVerified?: boolean;
}

function DishRow({
  item, onSavePortion, onDelete, busy,
}: {
  item: ItemRow;
  onSavePortion: (id: string, grams: number) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState(false);
  const [portionStr, setPortionStr] = useState(String(item.portionGrams));

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemTop}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <TouchableOpacity onPress={() => onDelete(item.id)} disabled={busy} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemBottom}>
        <View style={styles.portionRow}>
          <Text style={styles.portionLabel}>Khẩu phần:</Text>
          {editing ? (
            <TextInput
              style={styles.portionInput}
              value={portionStr}
              onChangeText={setPortionStr}
              keyboardType="numeric"
              autoFocus
              onBlur={() => {
                const g = parseFloat(portionStr);
                if (!isNaN(g) && g > 0 && g !== item.portionGrams) onSavePortion(item.id, g);
                else setPortionStr(String(item.portionGrams));
                setEditing(false);
              }}
            />
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.portionDisplay}>
              <Text style={styles.portionValue}>{Math.round(item.portionGrams)}g</Text>
              <Ionicons name="pencil" size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.itemCal}>{Math.round(item.calories)} kcal</Text>
      </View>

      <Text style={styles.itemMacros}>
        P {item.proteinG.toFixed(1)}g · C {item.carbsG.toFixed(1)}g · F {item.fatG.toFixed(1)}g
      </Text>
    </View>
  );
}

export default function MealTypeDetailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ type: string; profileId: string; date?: string }>();
  const mealType = params.type ?? 'snack';
  const meta = MEAL_META[mealType] ?? { label: mealType, icon: 'restaurant-outline' as const };
  const dateIso = params.date ?? TODAY_ISO;

  const utils = trpc.useUtils();
  const logsQuery = trpc.meal.getDailyLogs.useQuery(
    { profileId: params.profileId ?? '', date: dateIso },
    { enabled: !!params.profileId, retry: false },
  );

  const refresh = () => {
    void utils.meal.getDailyLogs.invalidate();
    void utils.meal.getDailySummary.invalidate();
  };

  const deleteItem = trpc.meal.deleteItem.useMutation({ onSuccess: refresh, onError: (e) => Alert.alert('Lỗi', e.message) });
  const updatePortion = trpc.meal.updateItemPortion.useMutation({ onSuccess: refresh, onError: (e) => Alert.alert('Lỗi', e.message) });

  const busy = deleteItem.isPending || updatePortion.isPending;
  const [showMicros, setShowMicros] = useState(false);

  // Flatten all items across every log of this meal type for the day.
  const items: ItemRow[] = (logsQuery.data ?? [])
    .filter((l) => l.mealType === mealType)
    .flatMap((l) =>
      l.items.map((i) => ({
        id: i.id,
        name: i.foodNameOverride ?? (i.food as { nameVi?: string } | null)?.nameVi ?? 'Món ăn',
        portionGrams: i.portionGrams,
        calories: i.calories,
        proteinG: i.proteinG,
        carbsG: i.carbsG,
        fatG: i.fatG,
        micronutrients: i.micronutrients as Record<string, number> | null,
        microVerified: (i as { microVerified?: boolean }).microVerified ?? false,
      })),
    );

  const totalCals = items.reduce((s, i) => s + i.calories, 0);
  const microRows = formatMicros(sumMicros(items.map((i) => i.micronutrients)));
  const microItems = items.filter((i) => i.micronutrients && Object.keys(i.micronutrients).length);
  const microVerified = microItems.length > 0 && microItems.every((i) => i.microVerified);

  const handleDelete = (id: string) => {
    const doDelete = () => deleteItem.mutate({ mealItemId: id });
    if (Platform.OS === 'web') doDelete();
    else Alert.alert('Xóa món', 'Bạn chắc chắn muốn xóa món này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{meta.label}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng {meta.label.toLowerCase()}</Text>
          <Text style={styles.totalVal}>{Math.round(totalCals)} <Text style={styles.totalUnit}>kcal</Text></Text>
          <Text style={styles.totalCount}>{items.length} món</Text>
        </View>

        {/* Micronutrients — collapsed ("Xem thêm vi chất") */}
        {microRows.length > 0 && (
          <View style={styles.microCard}>
            <TouchableOpacity style={styles.microToggle} onPress={() => setShowMicros((s) => !s)}>
              <Ionicons name="leaf-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.microToggleText}>
                {showMicros ? 'Ẩn vi chất' : `Xem thêm vi chất (${microRows.length})`}
              </Text>
              <Ionicons name={showMicros ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            {showMicros && (
              <View style={styles.microGrid}>
                {microRows.map((r) => (
                  <View key={r.key} style={styles.microItem}>
                    <Text style={styles.microLabel}>{r.label}</Text>
                    <Text style={styles.microValue}>{formatMicroValue(r.value)} {r.unit}</Text>
                  </View>
                ))}
                <Text style={styles.microNote}>
                  {microVerified
                    ? 'Dữ liệu đã xác minh'
                    : 'Ước tính bằng AI — chỉ mang tính tham khảo'}
                </Text>
              </View>
            )}
          </View>
        )}

        {logsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={meta.icon} size={44} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>Chưa có món nào cho {meta.label.toLowerCase()}</Text>
          </View>
        ) : (
          items.map((item) => (
            <DishRow
              key={item.id}
              item={item}
              busy={busy}
              onDelete={handleDelete}
              onSavePortion={(id, grams) => updatePortion.mutate({ mealItemId: id, portionGrams: grams })}
            />
          ))
        )}

        {/* Add more */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push({ pathname: '/(tabs)/camera', params: { mealType, date: dateIso } })}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.addText}>Thêm món cho {meta.label.toLowerCase()}</Text>
        </TouchableOpacity>
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
    totalCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18, marginBottom: 16,
      alignItems: 'center',
      shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    totalLabel: { fontSize: 13, color: theme.colors.textTertiary, fontWeight: '600' },
    totalVal: { fontSize: 36, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },
    totalUnit: { fontSize: 16, color: theme.colors.textTertiary, fontWeight: '600' },
    totalCount: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    microCard: {
      backgroundColor: theme.colors.surface, borderRadius: 14, marginBottom: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: theme.colors.border,
    },
    microToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
    microToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    microGrid: {
      flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 10,
      borderTopWidth: 1, borderTopColor: theme.colors.divider,
    },
    microItem: {
      width: '50%', flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 7, paddingRight: 14,
    },
    microLabel: { fontSize: 13, color: theme.colors.textSecondary },
    microValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    microNote: { width: '100%', fontSize: 11, color: theme.colors.textTertiary, marginTop: 4, fontStyle: 'italic' },
    itemCard: {
      backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text, marginRight: 8 },
    deleteBtn: { padding: 4 },
    itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    portionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    portionLabel: { fontSize: 13, color: theme.colors.textSecondary },
    portionDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    portionValue: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    portionInput: {
      borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 3, fontSize: 14,
      fontWeight: '700', color: theme.colors.primary, minWidth: 64, textAlign: 'center',
    },
    itemCal: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    itemMacros: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 8 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 44, marginBottom: 10 },
    emptyText: { fontSize: 14, color: theme.colors.textTertiary },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginTop: 8, padding: 15, borderRadius: 14,
      borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    },
    addText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  });
}
