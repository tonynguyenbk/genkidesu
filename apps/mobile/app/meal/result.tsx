import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { getPendingScan, clearPendingScan } from '../../lib/scanHandoff';
import { isSnackType, resolveSnackSubtype, SNACK_SUBTYPES, MEAL_META, defaultMealTime } from '../../lib/mealTypes';
import { formatMicros, sumMicros, formatMicroValue } from '../../lib/micronutrients';
import { MealSyncSheet, type SyncMember } from '../../components/meal/MealSyncSheet';
import { useProfileTheme } from '../../hooks/useProfileTheme';
import type { Theme } from '@genki/ui';
import { useAppTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { VisionResult, DetectedDish } from '@genki/api';

type EditableDish = DetectedDish & { key: string };

const MEAL_TYPE_OPTIONS = [
  { id: 'breakfast', label: 'Bữa sáng', icon: 'partly-sunny-outline' },
  { id: 'lunch',     label: 'Bữa trưa', icon: 'sunny-outline' },
  { id: 'dinner',    label: 'Bữa tối',  icon: 'moon-outline' },
  { id: 'snack',     label: 'Bữa phụ',  icon: 'nutrition-outline' },
] as const;

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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const confidence = Math.round(dish.confidence * 100);
  const confColor = confidence >= 85 ? theme.colors.success : confidence >= 70 ? theme.colors.warning : theme.colors.error;

  return (
    <View style={styles.dishCard}>
      <View style={styles.dishHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.dishName}>{dish.nameVi}</Text>
            <View style={[styles.confBadge, { backgroundColor: confColor + '20' }]}>
              <Text style={[styles.confText, { color: confColor }]}>{confidence}%</Text>
            </View>
            {dish.fromLabel ? (
              <View style={[styles.confBadge, { backgroundColor: theme.colors.successBg }]}>
                <Text style={[styles.confText, { color: theme.colors.success }]}>Nhãn dinh dưỡng</Text>
              </View>
            ) : dish.matchedFood && (
              dish.foodVerified !== false ? (
                <View style={[styles.confBadge, { backgroundColor: theme.colors.successBg }]}>
                  <Text style={[styles.confText, { color: theme.colors.success }]}>Đã xác minh</Text>
                </View>
              ) : (
                <View style={[styles.confBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <Text style={[styles.confText, { color: theme.colors.primary }]}>Cộng đồng</Text>
                </View>
              )
            )}
          </View>
          <Text style={styles.dishNameEn}>{dish.nameEn}</Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(dish.key)} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={22} color={theme.colors.textTertiary} />
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
            <Ionicons name="pencil" size={13} color={theme.colors.primary} />
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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isSenior, simplifiedMode } = useProfileTheme();
  // null = user hasn't toggled yet → derive from simplifiedMode (which loads async).
  // Once user taps the toggle we store an explicit boolean override.
  const [showDetailsOverride, setShowDetailsOverride] = useState<boolean | null>(null);
  const showDetails = showDetailsOverride !== null ? showDetailsOverride : !simplifiedMode;
  // Read the camera→result handoff once on mount. A hard page reload loses it
  // (it lives only in memory), so we bounce back to the camera in that case.
  const [pending] = useState(getPendingScan);
  useEffect(() => {
    if (!pending) router.replace('/(tabs)/camera');
    return () => clearPendingScan();
  }, []);

  const scanData = (pending?.scanData ?? {
    dishes: [], alerts: [], processingMs: 0,
    totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0,
  }) as VisionResult;
  const imageUri = pending?.imageUri;
  const profileId = pending?.profileId;

  const [dishes, setDishes] = useState<EditableDish[]>(
    (scanData.dishes ?? []).map((d, i) => ({ ...d, key: `dish-${i}` })),
  );
  // Editable here so the user can fix a wrong default (e.g. midnight → snack)
  // before saving, instead of having to re-scan from the camera screen.
  const initialType = pending?.mealType ?? 'snack';
  const [mealType, setMealType] = useState<string>(initialType);
  // The meal *eating* time (HH:MM), not the entry time. Defaults to the meal's
  // typical hour; changing the meal type updates it, and the user can fine-tune.
  const [mealTime, setMealTime] = useState<string>(defaultMealTime(initialType));

  // Pick a meal type and snap the time to that meal's typical hour.
  const chooseMealType = (t: string) => {
    setMealType(t);
    setMealTime(defaultMealTime(t));
  };

  const [showAddManual, setShowAddManual] = useState(false);
  const [showMicros, setShowMicros] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const manualSearch = trpc.food.search.useQuery(
    { query: manualQuery, limit: 8 },
    { enabled: manualQuery.trim().length >= 1 },
  );

  const utils = trpc.useUtils();

  // Group context — if the logger belongs to a group with other members, offer
  // to fan the meal out to them after saving (Meal Sync).
  const families = trpc.family.list.useQuery(undefined, { enabled: !!profileId, retry: false, staleTime: 30_000 });
  const family = families.data?.[0];
  const otherMembers: SyncMember[] = (family?.members ?? [])
    .filter((m) => m.profileId !== profileId)
    .map((m) => ({ profileId: m.profileId, name: m.profile.name, type: m.profile.type }));

  const [syncSheet, setSyncSheet] = useState<{ mealLogId: string; loggedAt: string } | null>(null);

  // Back-dated entries return to that day's detail; today's go to the home tab.
  const goNext = () => {
    const dest = pending?.loggedDate && pending.profileId
      ? { pathname: '/day-detail' as const, params: { date: pending.loggedDate, profileId: pending.profileId } }
      : '/(tabs)';
    router.replace(dest);
  };

  const confirm = trpc.meal.confirmLog.useMutation({
    onSuccess: (data) => {
      void utils.meal.getDailySummary.invalidate();
      void utils.meal.getDailyLogs.invalidate();
      // If there are other group members, show the Meal Sync sheet; otherwise leave.
      if (family && otherMembers.length > 0) {
        setSyncSheet({ mealLogId: data.id, loggedAt: new Date(data.loggedAt).toISOString() });
      } else {
        goNext();
      }
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

  // Aggregated micronutrients across all dishes (only those matched to a food
  // carry these), shown in the collapsible "Xem thêm vi chất" section.
  const microRows = formatMicros(sumMicros(dishes.map((d) => d.micronutrients)));
  const microDishes = dishes.filter((d) => d.micronutrients && Object.keys(d.micronutrients).length);
  // Verified only if every contributing dish has curated micronutrients.
  const microVerified = microDishes.length > 0 && microDishes.every((d) => d.microVerified);

  const handlePortionChange = (key: string, grams: number) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const ratio = grams / d.portionG;
        const micronutrients = d.micronutrients
          ? Object.fromEntries(
              Object.entries(d.micronutrients).map(([k, v]) => [k, parseFloat((v * ratio).toFixed(2))]),
            )
          : undefined;
        return {
          ...d,
          portionG: grams,
          calories: Math.round(d.calories * ratio),
          proteinG: parseFloat((d.proteinG * ratio).toFixed(1)),
          carbsG: parseFloat((d.carbsG * ratio).toFixed(1)),
          fatG: parseFloat((d.fatG * ratio).toFixed(1)),
          ...(micronutrients ? { micronutrients } : {}),
        };
      }),
    );
  };

  const handleAddManualFood = (food: FoodItem) => {
    const grams = food.typicalPortionG ?? 100;
    const ratio = grams / 100;
    setDishes((prev) => [
      ...prev,
      {
        key: `manual-${Date.now()}`,
        nameVi: food.nameVi,
        nameEn: food.nameEn ?? '',
        portionG: grams,
        calories: Math.round(food.calPer100g * ratio),
        proteinG: parseFloat((food.proteinPer100g * ratio).toFixed(1)),
        carbsG: parseFloat((food.carbsPer100g * ratio).toFixed(1)),
        fatG: parseFloat((food.fatPer100g * ratio).toFixed(1)),
        confidence: 1,
        foodId: food.id,
      },
    ]);
    setManualQuery('');
    setShowAddManual(false);
  };

  const handleConfirm = () => {
    // Build loggedAt from the target day (today, or a back-dated day from the
    // day-detail screen) + the chosen meal time (HH:MM), so the saved timestamp
    // is the eating time on the right day rather than this confirm moment.
    const loggedAt = pending?.loggedDate ? new Date(pending.loggedDate) : new Date();
    const [hh, mm] = mealTime.split(':').map((n) => parseInt(n, 10));
    if (!isNaN(hh) && !isNaN(mm)) loggedAt.setHours(hh, mm, 0, 0);

    confirm.mutate({
      profileId: profileId!,
      mealType: mealType as any,
      imageDataUrl: imageUri,
      rawAiResult: scanData,
      loggedAt: loggedAt.toISOString(),
      dishes: dishes.map(({ key: _key, confidence: _conf, ...d }) => d),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Kết quả AI</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo + AI badge */}
        {imageUri && (
          <View style={styles.photoRow}>
            <Image source={{ uri: imageUri }} style={styles.thumb} />
            <View>
              <Text style={styles.mealTime}>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color={theme.colors.info} />
                <Text style={styles.aiBadgeText}>AI phân tích trong {scanData.processingMs}ms</Text>
              </View>
            </View>
          </View>
        )}

        {/* Meal type selector — fix a wrong default before saving */}
        <View style={styles.mealTypeSelector}>
          {MEAL_TYPE_OPTIONS.map((m) => {
            // Snack chip represents the group → active for any sub-type.
            const active = m.id === 'snack' ? isSnackType(mealType) : mealType === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.mealTypeChip, active && styles.mealTypeChipActive]}
                onPress={() => chooseMealType(m.id === 'snack' ? resolveSnackSubtype() : m.id)}
              >
                <Ionicons
                  name={m.icon}
                  size={isSenior ? 22 : 18}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.mealTypeChipLabel,
                  isSenior && { fontSize: 14 },
                  active && styles.mealTypeChipLabelActive,
                ]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Snack sub-type selector — only when "Bữa phụ" is chosen */}
        {isSnackType(mealType) && (
          <View style={styles.subTypeSelector}>
            {SNACK_SUBTYPES.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[styles.subTypeChip, mealType === sub && styles.subTypeChipActive]}
                onPress={() => chooseMealType(sub)}
              >
                <Text style={[
                  styles.subTypeChipLabel,
                  mealType === sub && styles.subTypeChipLabelActive,
                ]}>
                  {MEAL_META[sub]!.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Meal eating time — saved as loggedAt, not the entry time */}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.timeLabel}>Giờ ăn:</Text>
          <TextInput
            style={styles.timeInput}
            value={mealTime}
            onChangeText={setMealTime}
            placeholder="HH:MM"
            placeholderTextColor={theme.colors.textTertiary}
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            onBlur={() => {
              const m = /^(\d{1,2}):(\d{2})$/.exec(mealTime);
              const h = m ? parseInt(m[1]!, 10) : NaN;
              const min = m ? parseInt(m[2]!, 10) : NaN;
              if (!m || h > 23 || min > 59) setMealTime(defaultMealTime(mealType));
              else setMealTime(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            }}
          />
        </View>

        {/* Total summary */}
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Tổng bữa ăn</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalVal}>{Math.round(totals.cal)}</Text>
              <Text style={styles.totalKey}>kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: theme.colors.warning }]}>{totals.c.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Tinh bột</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: theme.colors.info }]}>{totals.p.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Chất đạm</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalVal, { color: theme.colors.error }]}>{totals.f.toFixed(1)}g</Text>
              <Text style={styles.totalKey}>Chất béo</Text>
            </View>
          </View>
        </View>

        {/* Micronutrients — collapsed by default ("Xem thêm vi chất") */}
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

        {/* Alerts */}
        {(scanData.alerts ?? []).map((a, i) => (
          <View key={i} style={styles.alert}>
            <Ionicons name="information-circle" size={18} color={theme.colors.warning} />
            <Text style={styles.alertText}>{a}</Text>
          </View>
        ))}

        {/* Dish list — senior/simplified profiles see a plain readout first,
            with detailed editing tucked behind an explicit toggle so the
            default path stays "chụp ảnh → xác nhận → xong" (≤2 bước). */}
        {simplifiedMode && !showDetails ? (
          <>
            <Text style={[styles.sectionTitle, isSenior && styles.sectionTitleSenior]}>
              Đã nhận diện {dishes.length} món
            </Text>
            <View style={styles.simpleList}>
              {dishes.map((dish) => (
                <View key={dish.key} style={styles.simpleRow}>
                  <Text style={[styles.simpleDishName, isSenior && styles.simpleDishNameSenior]}>
                    {dish.nameVi}
                  </Text>
                  <Text style={[styles.simpleDishCal, isSenior && styles.simpleDishCalSenior]}>
                    {Math.round(dish.calories)} kcal
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowDetailsOverride(true)}>
              <Ionicons name="create-outline" size={isSenior ? 22 : 18} color={theme.colors.primary} />
              <Text style={[styles.detailsToggleText, isSenior && styles.detailsToggleTextSenior]}>
                Xem &amp; chỉnh sửa chi tiết từng món
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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

            {/* Teach Genki: user supplies label nutrition for a misrecognized product */}
            <TouchableOpacity
              style={styles.addManual}
              onPress={() => router.push({
                pathname: '/food/contribute' as any,
                params: dishes[0] ? { name: dishes[0].nameVi } : {},
              })}
            >
              <Ionicons name="school-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.addManualText}>Nhận diện chưa đúng? Dạy Genki món này</Text>
            </TouchableOpacity>

            {/* Add manual */}
            {!showAddManual ? (
              <TouchableOpacity style={styles.addManual} onPress={() => setShowAddManual(true)}>
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.addManualText}>Thêm món thủ công</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addManualPanel}>
                <View style={styles.addManualSearchRow}>
                  <Ionicons name="search" size={16} color={theme.colors.textTertiary} />
                  <TextInput
                    style={styles.addManualInput}
                    placeholder="Tìm món ăn..."
                    value={manualQuery}
                    onChangeText={setManualQuery}
                    placeholderTextColor={theme.colors.textTertiary}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => { setShowAddManual(false); setManualQuery(''); }}>
                    <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                {manualSearch.isLoading && (
                  <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />
                )}

                {((manualSearch.data ?? []) as FoodItem[]).map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.addManualResult}
                    onPress={() => handleAddManualFood(food)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addManualResultName}>{food.nameVi}</Text>
                      <Text style={styles.addManualResultSub}>
                        {food.typicalPortionG ?? 100}g · {Math.round(food.calPer100g * (food.typicalPortionG ?? 100) / 100)} kcal
                      </Text>
                    </View>
                    <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}

                {!manualSearch.isLoading && manualQuery.trim().length >= 1 && (manualSearch.data?.length ?? 0) === 0 && (
                  <Text style={styles.addManualEmpty}>Không tìm thấy "{manualQuery}"</Text>
                )}
              </View>
            )}

            {simplifiedMode && (
              <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowDetailsOverride(false)}>
                <Ionicons name="chevron-up-outline" size={18} color={theme.colors.textTertiary} />
                <Text style={styles.detailsToggleTextCollapse}>Thu gọn</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm button (fixed bottom) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            isSenior && styles.confirmBtnSenior,
            (confirm.isPending || dishes.length === 0) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={confirm.isPending || dishes.length === 0}
        >
          {confirm.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={isSenior ? 26 : 22} color="#fff" />
              <Text style={[styles.confirmBtnText, isSenior && styles.confirmBtnTextSenior]}>
                Xác nhận · {Math.round(totals.cal)} kcal
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Meal Sync — fan the just-saved meal out to other group members */}
      {syncSheet && family && profileId && (
        <MealSyncSheet
          visible
          onClose={goNext}
          onDone={goNext}
          familyId={family.id}
          mealLogId={syncSheet.mealLogId}
          mealTime={syncSheet.loggedAt}
          sourceKcal={totals.cal}
          mealName={dishes[0]?.nameVi ?? 'Bữa ăn'}
          members={otherMembers}
        />
      )}
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
    photoRow: {
      flexDirection: 'row', gap: 14, padding: 16,
      backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    thumb: { width: 72, height: 72, borderRadius: 12 },
    mealTime: { fontSize: 13, color: theme.colors.textTertiary, marginTop: 2 },
    mealTypeSelector: {
      flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14,
    },
    mealTypeChip: {
      flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
      backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border,
    },
    mealTypeChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
    mealTypeChipIcon: { fontSize: 18, marginBottom: 2 },
    mealTypeChipLabel: { fontSize: 11, color: theme.colors.textTertiary, fontWeight: '500' },
    mealTypeChipLabelActive: { color: theme.colors.primary, fontWeight: '700' },
    subTypeSelector: {
      flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8,
    },
    subTypeChip: {
      flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
      backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    },
    subTypeChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
    subTypeChipLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
    subTypeChipLabelActive: { color: theme.colors.primary, fontWeight: '700' },
    timeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingTop: 12,
    },
    timeLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    timeInput: {
      borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, fontWeight: '700',
      color: theme.colors.text, minWidth: 80, textAlign: 'center',
    },
    aiBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
      backgroundColor: theme.colors.infoBg, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 20, alignSelf: 'flex-start',
    },
    aiBadgeText: { fontSize: 11, color: theme.colors.info, fontWeight: '600' },
    totalCard: {
      backgroundColor: theme.colors.surface, margin: 16, borderRadius: 16, padding: 16,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    totalTitle: { fontSize: 13, color: theme.colors.textTertiary, marginBottom: 10, fontWeight: '600' },
    totalRow: { flexDirection: 'row' },
    totalItem: { flex: 1, alignItems: 'center' },
    totalVal: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
    totalKey: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2 },
    microCard: {
      backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 8,
      borderRadius: 14, overflow: 'hidden',
      borderWidth: 1, borderColor: theme.colors.border,
    },
    microToggle: {
      flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14,
    },
    microToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    microGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 14, paddingBottom: 8,
      borderTopWidth: 1, borderTopColor: theme.colors.divider,
    },
    microItem: {
      width: '50%', flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 7, paddingRight: 14,
    },
    microLabel: { fontSize: 13, color: theme.colors.textSecondary },
    microValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    microNote: { width: '100%', fontSize: 11, color: theme.colors.textTertiary, marginTop: 4, fontStyle: 'italic' },
    alert: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: theme.colors.warningBg, borderRadius: 10, padding: 10,
      borderWidth: 1, borderColor: theme.colors.warningBg,
    },
    alertText: { flex: 1, fontSize: 13, color: theme.colors.warning },
    sectionTitle: {
      fontSize: 13, fontWeight: '600', color: theme.colors.textTertiary,
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6,
    },
    sectionTitleSenior: { fontSize: 16, color: theme.colors.textSecondary },
    simpleList: {
      backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 4,
      borderRadius: 16, paddingVertical: 4,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    simpleRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    },
    simpleDishName: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1 },
    simpleDishNameSenior: { fontSize: 19 },
    simpleDishCal: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginLeft: 12 },
    simpleDishCalSenior: { fontSize: 18 },
    detailsToggle: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 16, marginTop: 10, padding: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    },
    detailsToggleText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
    detailsToggleTextSenior: { fontSize: 17 },
    detailsToggleTextCollapse: { fontSize: 14, color: theme.colors.textTertiary, fontWeight: '600' },
    dishCard: {
      backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 10,
      borderRadius: 16, padding: 14,
      shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    dishHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    dishName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    dishNameEn: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 },
    confBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
    confText: { fontSize: 11, fontWeight: '700' },
    removeBtn: { padding: 4 },
    portionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    portionLabel: { fontSize: 13, color: theme.colors.textSecondary },
    portionDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    portionValue: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    portionInput: {
      borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 4, fontSize: 14,
      fontWeight: '700', color: theme.colors.primary, minWidth: 60, textAlign: 'center',
    },
    macros: {
      flexDirection: 'row', backgroundColor: theme.colors.divider, borderRadius: 10, padding: 10,
    },
    macroItem: { flex: 1, alignItems: 'center' },
    macroVal: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    macroKey: { fontSize: 10, color: theme.colors.textTertiary, marginTop: 1 },
    macroDivider: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: 4 },
    addManual: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 16, marginTop: 4, padding: 14,
      borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, borderStyle: 'dashed',
    },
    addManualText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
    addManualPanel: {
      backgroundColor: theme.colors.surface, marginHorizontal: 16, marginTop: 4,
      borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, padding: 10,
    },
    addManualSearchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: theme.colors.divider, borderRadius: 10, paddingHorizontal: 10, height: 40,
    },
    addManualInput: { flex: 1, fontSize: 14, color: theme.colors.text },
    addManualResult: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 10, paddingHorizontal: 4,
      borderTopWidth: 1, borderTopColor: theme.colors.divider,
    },
    addManualResultName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    addManualResultSub: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 },
    addManualEmpty: { fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 12 },
    bottomBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: theme.colors.surface, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1, borderTopColor: theme.colors.divider,
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary, padding: 17, borderRadius: 16, alignItems: 'center',
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    confirmBtnSenior: { padding: 21, borderRadius: 18 },
    confirmBtnDisabled: { backgroundColor: theme.colors.textTertiary },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    confirmBtnTextSenior: { fontSize: 19 },
  });
}
