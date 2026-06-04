import type { NutritionTargets, ProfileType, Gender } from '../types/index.js';

export const DEFAULT_NUTRITION_TARGETS: Record<ProfileType, NutritionTargets> = {
  adult: { calories: 2000, proteinG: 75, carbsG: 250, fatG: 65, fiberG: 25 },
  senior: { calories: 1800, proteinG: 70, carbsG: 225, fatG: 60, fiberG: 21 },
  teen: { calories: 2200, proteinG: 85, carbsG: 285, fatG: 70, fiberG: 26 },
  baby: { calories: 1000, proteinG: 13, carbsG: 130, fatG: 38, fiberG: 10 },
};

export const GENDER_CALORIE_ADJUSTMENT: Record<Gender, number> = {
  male: 200,
  female: 0,
  other: 100,
};

export const ACTIVITY_LEVEL_LABELS: Record<number, string> = {
  1: 'Ít vận động',
  2: 'Vận động nhẹ',
  3: 'Vận động vừa',
  4: 'Vận động nhiều',
  5: 'Rất nhiều',
};
