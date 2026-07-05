import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc } from '../lib/trpc';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

interface FoodItem {
  id: string;
  nameVi: string;
  nameEn: string | null;
  calPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  typicalPortionG: number | null;
  category: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Sáng', main_dish: 'Chính', soup: 'Canh',
  vegetable: 'Rau', protein: 'Thịt/Cá', drink: 'Uống',
  dessert: 'Tráng miệng', snack: 'Snack', baby_food: 'Ăn dặm',
  formula: 'Sữa', healthy: 'Healthy',
};

const QUICK_CATEGORIES = ['breakfast', 'main_dish', 'vegetable', 'protein', 'drink', 'healthy'];

export default function FoodSearchScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ profileId: string; mealType: string; loggedAt: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionG, setPortionG] = useState('');

  const searchResults = trpc.food.search.useQuery(
    { query, limit: 20 },
    { enabled: query.length >= 1 },
  );

  const categoryResults = trpc.food.list.useQuery(
    { category: category ?? undefined, limit: 20 },
    { enabled: !query && !!category },
  );

  const confirmLog = trpc.meal.confirmLog.useMutation({
    onSuccess: () => router.replace('/(tabs)'),
  });

  const displayItems: FoodItem[] = query
    ? (searchResults.data ?? []) as FoodItem[]
    : category
      ? (categoryResults.data ?? []) as FoodItem[]
      : [];

  const isLoading = query ? searchResults.isLoading : category ? categoryResults.isLoading : false;

  const handleAdd = useCallback(() => {
    if (!selectedFood || !params.profileId) return;
    const grams = portionG ? Number(portionG) : (selectedFood.typicalPortionG ?? 100);
    const ratio = grams / 100;
    confirmLog.mutate({
      profileId: params.profileId,
      mealType: (params.mealType ?? 'lunch') as any,
      loggedAt: params.loggedAt ?? new Date().toISOString(),
      dishes: [{
        nameVi: selectedFood.nameVi,
        nameEn: selectedFood.nameEn ?? undefined,
        portionG: grams,
        calories: Math.round(selectedFood.calPer100g * ratio),
        proteinG: parseFloat((selectedFood.proteinPer100g * ratio).toFixed(1)),
        carbsG: parseFloat((selectedFood.carbsPer100g * ratio).toFixed(1)),
        fatG: parseFloat((selectedFood.fatPer100g * ratio).toFixed(1)),
      }],
    });
  }, [selectedFood, portionG, params, confirmLog]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món ăn..."
            value={query}
            onChangeText={(v) => { setQuery(v); setCategory(null); setSelectedFood(null); }}
            autoFocus
            placeholderTextColor={theme.colors.textTertiary}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category chips */}
      {!query && (
        <View style={styles.catRow}>
          {QUICK_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => { setCategory(cat === category ? null : cat); setSelectedFood(null); }}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Food list */}
      {selectedFood ? (
        // Portion selector
        <View style={styles.portionView}>
          <View style={styles.portionCard}>
            <Text style={styles.portionTitle}>{selectedFood.nameVi}</Text>
            <Text style={styles.portionSub}>{selectedFood.nameEn}</Text>

            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>Khẩu phần (g)</Text>
              <TextInput
                style={styles.portionInput}
                value={portionG}
                onChangeText={setPortionG}
                keyboardType="decimal-pad"
                placeholder={String(selectedFood.typicalPortionG ?? 100)}
                placeholderTextColor={theme.colors.textTertiary}
                autoFocus
              />
            </View>

            {/* Nutrition preview */}
            {(() => {
              const g = portionG ? Number(portionG) : (selectedFood.typicalPortionG ?? 100);
              const r = g / 100;
              return (
                <View style={styles.macroPreview}>
                  {[
                    { label: 'Calo', val: Math.round(selectedFood.calPer100g * r), unit: 'kcal', color: theme.colors.primary },
                    { label: 'Protein', val: (selectedFood.proteinPer100g * r).toFixed(1), unit: 'g', color: theme.colors.info },
                    { label: 'Carbs', val: (selectedFood.carbsPer100g * r).toFixed(1), unit: 'g', color: theme.colors.warning },
                    { label: 'Fat', val: (selectedFood.fatPer100g * r).toFixed(1), unit: 'g', color: theme.colors.error },
                  ].map((m) => (
                    <View key={m.label} style={styles.macroItem}>
                      <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
                      <Text style={styles.macroUnit}>{m.unit}</Text>
                      <Text style={styles.macroLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            <View style={styles.portionButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedFood(null)}>
                <Text style={styles.cancelText}>← Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, confirmLog.isPending && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={confirmLog.isPending}
              >
                {confirmLog.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.addBtnText}>Thêm vào bữa ăn</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.foodRow} onPress={() => {
              setSelectedFood(item);
              setPortionG(String(item.typicalPortionG ?? 100));
            }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>{item.nameVi}</Text>
                <Text style={styles.foodSub}>
                  {CATEGORY_LABELS[item.category ?? ''] ?? ''} · {item.typicalPortionG ?? 100}g thường
                </Text>
              </View>
              <View style={styles.foodCal}>
                <Text style={styles.foodCalNum}>{Math.round(item.calPer100g * (item.typicalPortionG ?? 100) / 100)}</Text>
                <Text style={styles.foodCalUnit}>kcal</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
          ListHeaderComponent={isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null}
          ListEmptyComponent={!isLoading && (query || category) ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={36} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>
                {query ? `Không tìm thấy "${query}"` : 'Không có món nào'}
              </Text>
              <TouchableOpacity
                style={styles.teachBtn}
                onPress={() => router.push({
                  pathname: '/food/contribute' as any,
                  params: query ? { name: query } : {},
                })}
              >
                <Ionicons name="school-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.teachBtnText}>Dạy Genki món này</Text>
              </TouchableOpacity>
            </View>
          ) : !query && !category ? (
            <View style={styles.hint}>
              <Text style={styles.hintText}>Gõ tên món ăn hoặc chọn nhóm bên trên</Text>
            </View>
          ) : null}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    backBtn: { padding: 4 },
    searchBox: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: theme.colors.divider, borderRadius: 12, paddingHorizontal: 12, height: 44,
      borderWidth: 1.5, borderColor: theme.colors.border,
    },
    searchInput: { flex: 1, fontSize: 16, color: theme.colors.text },
    catRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    catChip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
      borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.divider,
    },
    catChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
    catText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
    catTextActive: { color: theme.colors.primary },
    foodRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    foodName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    foodSub: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    foodCal: { alignItems: 'flex-end' },
    foodCalNum: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
    foodCalUnit: { fontSize: 10, color: theme.colors.textTertiary },
    loading: { padding: 24, alignItems: 'center' },
    empty: { padding: 48, alignItems: 'center', gap: 8 },
    teachBtn: {
      marginTop: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: theme.colors.surface,
    },
    teachBtnText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
    emptyIcon: { fontSize: 40 },
    emptyText: { fontSize: 15, color: theme.colors.textTertiary, textAlign: 'center' },
    hint: { padding: 48, alignItems: 'center' },
    hintText: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' },

    portionView: { flex: 1, padding: 16 },
    portionCard: {
      backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, gap: 16,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    portionTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    portionSub: { fontSize: 13, color: theme.colors.textTertiary, marginTop: -10 },
    portionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    portionLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    portionInput: {
      borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 22, fontWeight: '800', color: theme.colors.primary,
      minWidth: 100, textAlign: 'center',
    },
    macroPreview: {
      flexDirection: 'row', backgroundColor: theme.colors.divider, borderRadius: 14, padding: 14,
    },
    macroItem: { flex: 1, alignItems: 'center' },
    macroVal: { fontSize: 20, fontWeight: '800' },
    macroUnit: { fontSize: 10, color: theme.colors.textTertiary },
    macroLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    portionButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
      borderWidth: 1.5, borderColor: theme.colors.border,
    },
    cancelText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },
    addBtn: {
      flex: 2, backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, alignItems: 'center',
      shadowColor: theme.colors.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
    },
    addBtnDisabled: { backgroundColor: theme.colors.textTertiary },
    addBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
