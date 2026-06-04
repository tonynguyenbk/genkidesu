import type { Gender, ActivityLevel, TdeeResult } from '../types/index.js';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  1: 1.2,
  2: 1.375,
  3: 1.55,
  4: 1.725,
  5: 1.9,
};

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender,
  activityLevel: ActivityLevel,
): TdeeResult {
  const bmr = calculateBMR(weightKg, heightCm, ageYears, gender);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = Math.round(bmr * activityMultiplier);
  return { bmr: Math.round(bmr), tdee, activityMultiplier };
}

export function getAgeFromBirthDate(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
