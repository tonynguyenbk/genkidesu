import type { Profile } from '@genki/db';

const ACTIVITY_MULTIPLIERS: Record<number, number> = {
  1: 1.2,
  2: 1.375,
  3: 1.55,
  4: 1.725,
  5: 1.9,
};

export function calculateTDEE(profile: Pick<Profile, 'weightKg' | 'heightCm' | 'birthDate' | 'gender' | 'activityLevel'>): number | null {
  if (!profile.weightKg || !profile.heightCm || !profile.birthDate || !profile.gender) {
    return null;
  }

  const today = new Date();
  const birth = new Date(profile.birthDate);
  const age = today.getFullYear() - birth.getFullYear();

  const bmr =
    profile.gender === 'male'
      ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + 5
      : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.375;
  return Math.round(bmr * multiplier);
}

export function getDefaultNutritionTargets(
  type: string,
  tdee: number | null,
) {
  const calories = tdee ?? (type === 'senior' ? 1800 : type === 'teen' ? 2200 : type === 'baby' ? 1000 : 2000);
  return {
    calories,
    protein_g: Math.round(calories * 0.15 / 4),
    carbs_g: Math.round(calories * 0.55 / 4),
    fat_g: Math.round(calories * 0.30 / 9),
  };
}

export function getDefaultUiPreferences(type: string) {
  switch (type) {
    case 'senior':
      return { font_scale: 1.4, theme: 'senior', simplified_mode: true };
    case 'teen':
      return { font_scale: 1.0, theme: 'vibrant', simplified_mode: false };
    case 'baby':
      return { font_scale: 1.0, theme: 'pastel', simplified_mode: false };
    default:
      return { font_scale: 1.0, theme: 'default', simplified_mode: false };
  }
}
