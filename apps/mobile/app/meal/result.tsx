import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trpc, queryClient } from '../../lib/trpc';
import type { VisionResult, DetectedDish } from '@genki/api';

type EditableDish = DetectedDish & { key: string };

function DishCard({
  dish, index, onRemove, onPortionChange,
}: {
  dish: EditableDish;
  index: number;
  onRemove: (key: string) => void;
  onPortionChange: (key: string, grams: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [portionStr, setPortionStr] = useState(String(dish.portionG));

  const confidence = Math.round(dish.confidence * 100);
  const confColor = confidence >= 85 ? '#2ECC71' : confidence >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <View style={styles.dishCard}>
      <View style={styles.dishHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.dishName}>{dish.nameVi}</Text>
            <View style={[styles.confBadge, { backgroundColor: confColor + '20' }]}>
              <Text style={[styles.confText, { color: confColor }]}>{confidence}%</Text>
            </View>
          </View>
          <Text style={styles.dishNameEn}>{dish.nameEn}</Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(dish.key)} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Portion editor */}
      <View style={styles.portionRow}>
        <Text style={styles.portionLabel}>Khẩu phần:</Text>
        {editing ? (
          <TextInput
            style={styles.portionInput}
            value={portionStr}
            onChangeText={setPortionStr}
            keyboardType="numeric"
            onBlur={() => {
              const g = parseFloat(portionStr);
              if (!isNaN(g) && g > 0) onPortionChange(dish.key, g);
              else setPortionStr(String(dish.portionG));
              setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.portionDisplay}>
            <Text style={styles.portionValue}>{dish.portionG}g</Text>
            <Ionicons name="pencil" size={13} color="#2ECC71" />
          </TouchableOpacity>
        )}
      </View>

      {/* Macros row */}
      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <Text style={styles.macroVal}>{Math.round(dish.calories)}</Text>
          <Text style={styles.macroKey}>kcal</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroVal}>{dish.proteinG.toFixed(1)}</Text>
          <Text style={styles.macroKey}>protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroVal}>{dish.carbsG.toFixed(1)}</Text>
          <Text style={styles.macroKey}>carbs</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroVal}>{dish.fatG.toFixed(1)}</Text>
          <Text style={styles.macroKey}>fat</Text>
        </View>
      </View>
    </View>
  );
}

export default function MealResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    scanData: string;
    profileId: string;
    mealType: string;
    imageUri: string;
  }>();

  const scanData = JSON.parse(params.scanData ?? '{}') as VisionResult;
  const [dishes, setDishes] = useState<EditableDish[]>(
    (scanData.dishes ?? []).map((d, i) => ({ ...d, key: `dish-${i}` })),
  );

  const confirm = trpc.meal.confirmLog.useMutation({
    onSuccess: () => {
      // Invalidate home screen queries so they refetch immediately
      queryClient.invalidateQueries({ queryKey: [['meal', 'getDailySummary']] });
      queryClient.invalidateQueries({ queryKey: [['meal', 'getDailyLogs']] });
      Alert.alert('Đã lưu! ✓', 'Bữa ăn đã được ghi nhận thành công.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const totals = dishes.reduce(
    (acc, d) => ({
      cal: acc.cal + d.calories,
      p: acc.p + d.proteinG,
      c: acc.c + d.carbsG,
      f: acc.f + d.fatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const handlePortionChange = (key: string, grams: number) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const ratio = grams / d.portionG;
        return {
          ...d,
          portionG: grams,
          calories: Math.round(d.calories * ratio),
          proteinG: parseFloat((d.proteinG * ratio).toFixed(1)),
          carbsG: parseFloat((d.carbsG * ratio).toFixed(1)),
          fatG: parseFloat((d.fatG * ratio).toFixed(1)),
        };
      }),
    );
  };

  const handleConfirm = () => {
    confirm.mutate({
      profileId: params.profileId!,
      mealType: params.mealType as any,
      imageDataUrl: params.imageUri,
      loggedAt: new Date().toISOString(),
      dishes: dishes.map(({ key: _key, confidence: _conf, ...d }) => d),
    });
  };

  const MEAL_LABELS: Record<string, string> = {
    breakfast: '🌅 Bữa sáng', lunch: '☀️ Bữa trưa',
    dinner: '🌙 Bữa tối', snack: '🍎 Snack',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Kết quả AI</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo + label */}
        {params.imageUri && (
          <View style={styles.photoRow}>
            <Image source={{ uri: params.imageUri }} style={styles.thumb} />
            <View>
              <Text style={styles.mealLabel}>{MEAL_LABELS[params.mealType ?? 'lunch']}</Text>
              <Text style={styles.mealTime}>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                <Text style={styles.aiBadgeText}>AI phân tích trong {scanData.processingMs}ms</Text>
              </View>
            </View>
          </View>
        )}

        {/* Total summary */}
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Tổng bữa ăn</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalVal}>{Math.round(totals.cal)}</Text>
              <Text style={styles.totalKey}>kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: '#3B82F6' }]}>{totals.p.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Protein</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: '#F59E0B' }]}>{totals.c.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Carbs</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: '#EF4444' }]}>{totals.f.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {(scanData.alerts ?? []).map((a, i) => (
          <View key={i} style={styles.alert}>
            <Ionicons name="information-circle" size={18} color="#F59E0B" />
            <Text style={styles.alertText}>{a}</Text>
          </View>
        ))}

        {/* Dish list */}
        <Text style={styles.sectionTitle}>
          {dishes.length} món đã nhận diện — chỉnh sửa nếu cần
        </Text>

        {dishes.map((dish, i) => (
          <DishCard
            key={dish.key}
            dish={dish}
            index={i}
            onRemove={(k) => setDishes((p) => p.filter((d) => d.key !== k))}
            onPortionChange={handlePortionChange}
          />
        ))}

        {/* Add manual */}
        <TouchableOpacity style={styles.addManual}>
          <Ionicons name="add-circle-outline" size={20} color="#2ECC71" />
          <Text style={styles.addManualText}>Thêm món thủ công</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm button (fixed bottom) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, (confirm.isPending || dishes.length === 0) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={confirm.isPending || dishes.length === 0}
        >
          {confirm.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmBtnText}>Lưu bữa ăn · {Math.round(totals.cal)} kcal</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF9' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  photoRow: {
    flexDirection: 'row', gap: 14, padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  mealLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  mealTime: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  aiBadgeText: { fontSize: 11, color: '#8B5CF6', fontWeight: '600' },
  totalCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  totalTitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 10, fontWeight: '600' },
  totalRow: { flexDirection: 'row' },
  totalItem: { flex: 1, alignItems: 'center' },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#111827' },
  totalKey: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  alert: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400E' },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6,
  },
  dishCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  dishHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  dishName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dishNameEn: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  confBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  confText: { fontSize: 11, fontWeight: '700' },
  removeBtn: { padding: 4 },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  portionLabel: { fontSize: 13, color: '#6B7280' },
  portionDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  portionValue: { fontSize: 14, fontWeight: '700', color: '#2ECC71' },
  portionInput: {
    borderWidth: 1.5, borderColor: '#2ECC71', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, fontSize: 14,
    fontWeight: '700', color: '#2ECC71', minWidth: 60, textAlign: 'center',
  },
  macros: {
    flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10,
  },
  macroItem: { flex: 1, alignItems: 'center' },
  macroVal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  macroKey: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  macroDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  addManual: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 4, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  addManualText: { fontSize: 14, color: '#2ECC71', fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  confirmBtn: {
    backgroundColor: '#2ECC71', padding: 17, borderRadius: 16, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#9CA3AF' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
