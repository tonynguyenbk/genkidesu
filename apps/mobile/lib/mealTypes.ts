import type { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Canonical meal-type metadata shared across home, result, camera and detail
// screens so labels/icons stay consistent. Icons are Ionicons names (SF-symbol
// style per the Apple HIG design language — no emoji in UI chrome).
// "Bữa phụ" (snack) is split into three sub-types by time of day; the legacy
// plain `snack` is treated as part of the group.

export const MEAL_META: Record<string, { label: string; icon: IoniconName }> = {
  breakfast:       { label: 'Bữa sáng',  icon: 'partly-sunny-outline' },
  lunch:           { label: 'Bữa trưa',  icon: 'sunny-outline' },
  dinner:          { label: 'Bữa tối',   icon: 'moon-outline' },
  snack:           { label: 'Bữa phụ',   icon: 'nutrition-outline' }, // legacy + group label
  snack_morning:   { label: 'Phụ sáng',  icon: 'cafe-outline' },
  snack_afternoon: { label: 'Phụ chiều', icon: 'nutrition-outline' },
  snack_evening:   { label: 'Phụ tối',   icon: 'ice-cream-outline' },
  baby_meal:       { label: 'Ăn dặm',    icon: 'restaurant-outline' },
  formula:         { label: 'Sữa',       icon: 'water-outline' },
};

// The three pickable snack sub-types (in display order).
export const SNACK_SUBTYPES = ['snack_morning', 'snack_afternoon', 'snack_evening'] as const;

// Everything counted under the "Bữa phụ" group, incl. legacy `snack`.
export const SNACK_TYPES: string[] = ['snack', 'snack_morning', 'snack_afternoon', 'snack_evening'];

export function isSnackType(t: string): boolean {
  return SNACK_TYPES.includes(t);
}

export function mealLabel(t: string): string {
  return MEAL_META[t]?.label ?? t;
}

export function mealIcon(t: string): IoniconName {
  return MEAL_META[t]?.icon ?? 'restaurant-outline';
}

// Picks a snack sub-type from the clock: morning < 11h, afternoon < 17h, else evening.
export function resolveSnackSubtype(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 11) return 'snack_morning';
  if (h < 17) return 'snack_afternoon';
  return 'snack_evening';
}

// Natural chronological order of meals through the day — used to sort history by
// meal sequence (sáng → phụ sáng → trưa → phụ chiều → tối → phụ tối) regardless
// of when each was entered.
export const MEAL_ORDER: Record<string, number> = {
  breakfast: 0, snack_morning: 1, lunch: 2,
  snack: 3, snack_afternoon: 3, dinner: 4, snack_evening: 5,
  baby_meal: 6, formula: 7,
};
export function mealOrder(t: string): number {
  return MEAL_ORDER[t] ?? 99;
}

// Representative clock time per meal — used as the default "meal time" so a log
// reflects when the meal is eaten, not when it was entered. User-editable.
export const MEAL_DEFAULT_TIME: Record<string, string> = {
  breakfast: '07:00', snack_morning: '09:30', lunch: '12:00',
  snack_afternoon: '15:00', snack: '15:00', dinner: '19:00', snack_evening: '21:00',
  baby_meal: '10:00', formula: '08:00',
};
export function defaultMealTime(t: string): string {
  return MEAL_DEFAULT_TIME[t] ?? '12:00';
}
