import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@genki/ui';
import { trpc, queryClient } from '../lib/trpc';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useAppTheme, useThemedStyles } from '../contexts/ThemeContext';

type FeedType = 'breast_milk' | 'formula' | 'solid';

const FEED_OPTIONS: {
  type: FeedType; label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  unit: string; defaultAmount: number;
}[] = [
  { type: 'breast_milk', label: 'Sữa mẹ', icon: 'heart-outline', unit: 'ml', defaultAmount: 120 },
  { type: 'formula',     label: 'Sữa công thức', icon: 'water-outline', unit: 'ml', defaultAmount: 150 },
  { type: 'solid',       label: 'Ăn dặm', icon: 'restaurant-outline', unit: 'g', defaultAmount: 80 },
];

// Nutrition per 100ml/100g
const NUTRITION: Record<FeedType, { cal: number; protein: number; carbs: number; fat: number }> = {
  breast_milk: { cal: 67,  protein: 1.2, carbs: 7.2, fat: 3.6 },
  formula:     { cal: 68,  protein: 1.4, carbs: 7.3, fat: 3.5 },
  solid:       { cal: 80,  protein: 2.0, carbs: 15.0, fat: 2.0 },
};

const MEAL_TYPE_MAP: Record<FeedType, 'baby_meal' | 'formula'> = {
  breast_milk: 'baby_meal',
  formula:     'formula',
  solid:       'baby_meal',
};

export default function BabyFeedScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [step, setStep] = useState<1 | 2>(1);
  const [feedType, setFeedType] = useState<FeedType>('breast_milk');
  const [amount, setAmount] = useState('');

  const { activeProfile: profile } = useActiveProfile();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore TS2589 — known tRPC deep-inference limit
  const confirmLog = trpc.meal.confirmLog.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['meal', 'getDailyLogs']] });
      queryClient.invalidateQueries({ queryKey: [['meal', 'getDailySummary']] });
      router.back();
    },
    onError: (e) => Alert.alert('Lỗi', e.message),
  });

  const selected = FEED_OPTIONS.find((f) => f.type === feedType)!;
  const amountNum = parseFloat(amount) || selected.defaultAmount;
  const nutrition = NUTRITION[feedType];
  const factor = amountNum / 100;
  const calories = Math.round(nutrition.cal * factor);
  const protein = +(nutrition.protein * factor).toFixed(1);
  const carbs = +(nutrition.carbs * factor).toFixed(1);
  const fat = +(nutrition.fat * factor).toFixed(1);

  const handleLog = () => {
    if (!profile) return Alert.alert('Lỗi', 'Không tìm thấy hồ sơ em bé');
    const mealType = MEAL_TYPE_MAP[feedType];
    confirmLog.mutate({
      profileId: profile.id,
      mealType,
      loggedAt: new Date().toISOString(),
      dishes: [{
        nameVi: selected.label + (feedType !== 'solid' ? ` ${amountNum}${selected.unit}` : ''),
        portionG: amountNum,
        calories,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
      }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ghi nhận bữa ăn</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {[1, 2].map((n) => (
          <View key={n} style={[styles.dot, step >= n && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={styles.stepTitle}>Loại bữa ăn</Text>
            <Text style={styles.stepSub}>Bé ăn gì?</Text>

            <View style={styles.optionList}>
              {FEED_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={[styles.optionCard, feedType === opt.type && styles.optionCardActive]}
                  onPress={() => setFeedType(opt.type)}
                >
                  <Ionicons name={opt.icon} size={24} color={theme.colors.primary} style={{ marginRight: 4 }} />
                  <View>
                    <Text style={[styles.optionLabel, feedType === opt.type && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionUnit}>Đơn vị: {opt.unit}</Text>
                  </View>
                  {feedType === opt.type && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} style={{ marginLeft: 'auto' as any }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
              <Text style={styles.nextBtnText}>Tiếp theo →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stepTitle}>Số lượng</Text>
            <Text style={styles.stepSub}>
              {selected.label} — nhập {selected.unit}
            </Text>

            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={String(selected.defaultAmount)}
                placeholderTextColor={theme.colors.textTertiary}
                autoFocus
              />
              <Text style={styles.amountUnit}>{selected.unit}</Text>
            </View>

            {/* Quick amount chips */}
            <View style={styles.chips}>
              {(feedType === 'solid'
                ? [50, 80, 120, 150]
                : [60, 90, 120, 150, 180]
              ).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, amount === String(v) && styles.chipActive]}
                  onPress={() => setAmount(String(v))}
                >
                  <Text style={[styles.chipText, amount === String(v) && styles.chipTextActive]}>
                    {v}{selected.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nutrition preview */}
            <View style={styles.nutritionCard}>
              <Text style={styles.nutritionTitle}>Dinh dưỡng ước tính</Text>
              <View style={styles.nutritionRow}>
                {[
                  { label: 'Calories', val: calories, unit: 'kcal', color: theme.colors.primary },
                  { label: 'Protein', val: protein, unit: 'g', color: theme.colors.info },
                  { label: 'Carbs', val: carbs, unit: 'g', color: theme.colors.warning },
                  { label: 'Fat', val: fat, unit: 'g', color: theme.colors.textSecondary },
                ].map((n) => (
                  <View key={n.label} style={styles.nutritionItem}>
                    <Text style={[styles.nutritionVal, { color: n.color }]}>{n.val}</Text>
                    <Text style={styles.nutritionUnit}>{n.unit}</Text>
                    <Text style={styles.nutritionLabel}>{n.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.logBtn, confirmLog.isPending && { opacity: 0.6 }]}
              onPress={handleLog}
              disabled={confirmLog.isPending}
            >
              {confirmLog.isPending
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.logBtnText}>Ghi nhận bữa ăn</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface,
      borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceAlt,
    },
    backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceAlt },
    dotActive: { backgroundColor: theme.colors.primary, width: 20 },
    content: { padding: 20, gap: 20, paddingBottom: 48 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
    stepSub: { fontSize: 14, color: theme.colors.textTertiary, marginTop: -12 },
    optionList: { gap: 12 },
    optionCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
      backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 2, borderColor: theme.colors.surfaceAlt,
    },
    optionCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.background },
    optionEmoji: { fontSize: 32 },
    optionLabel: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    optionLabelActive: { color: theme.colors.secondary },
    optionUnit: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
    nextBtn: {
      backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center',
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    amountRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    amountInput: {
      borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 16,
      paddingHorizontal: 24, paddingVertical: 16, fontSize: 42, fontWeight: '800',
      color: theme.colors.secondary, textAlign: 'center', backgroundColor: theme.colors.surface, width: 180,
    },
    amountUnit: { fontSize: 20, fontWeight: '600', color: theme.colors.textTertiary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    chip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.surfaceAlt,
    },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.background },
    chipText: { fontSize: 14, fontWeight: '500', color: theme.colors.textTertiary },
    chipTextActive: { color: theme.colors.secondary, fontWeight: '700' },
    nutritionCard: {
      backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: theme.colors.surfaceAlt,
    },
    nutritionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textTertiary, marginBottom: 12 },
    nutritionRow: { flexDirection: 'row' },
    nutritionItem: { flex: 1, alignItems: 'center' },
    nutritionVal: { fontSize: 20, fontWeight: '800' },
    nutritionUnit: { fontSize: 10, color: theme.colors.textTertiary },
    nutritionLabel: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2 },
    logBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16,
      shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    logBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
