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

// "Người lớn" (23-55, theo persona spec) chia thêm thành thanh niên / trung niên
// ở mốc 40 — chỉ ảnh hưởng tới khẩu phần mặc định & tag tham khảo cho AI/cảnh báo,
// KHÔNG tạo thêm ProfileType (giữ đúng 4 loại đã chốt trong kiến trúc).
const MIDDLE_AGE_CUTOFF = 40;

export type AdultAgeGroup = 'thanh_nien' | 'trung_nien';

export function getAdultAgeGroup(birthDate: Date | string | null | undefined): AdultAgeGroup | null {
  if (!birthDate) return null;
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  return age >= MIDDLE_AGE_CUTOFF ? 'trung_nien' : 'thanh_nien';
}

export function getDefaultNutritionTargets(
  type: string,
  tdee: number | null,
  birthDate?: Date | string | null,
) {
  const calories = tdee ?? (type === 'senior' ? 1800 : type === 'teen' ? 2200 : type === 'baby' ? 1000 : 2000);

  // Trung niên (40-55): chuyển hóa chậm hơn, nguy cơ mỡ máu cao hơn — khẩu phần
  // mặc định giảm tỉ lệ carb, tăng đạm để hỗ trợ giữ khối cơ. Đây là gợi ý mặc
  // định chung, người dùng vẫn chỉnh được theo tư vấn chuyên môn.
  const isMiddleAged = type === 'adult' && getAdultAgeGroup(birthDate) === 'trung_nien';
  const proteinRatio = isMiddleAged ? 0.20 : 0.15;
  const carbsRatio = isMiddleAged ? 0.45 : 0.55;
  const fatRatio = isMiddleAged ? 0.35 : 0.30;

  return {
    calories,
    protein_g: Math.round(calories * proteinRatio / 4),
    carbs_g: Math.round(calories * carbsRatio / 4),
    fat_g: Math.round(calories * fatRatio / 9),
  };
}

export function getDefaultUiPreferences(type: string, birthDate?: Date | string | null) {
  switch (type) {
    case 'senior':
      return { font_scale: 1.4, theme: 'senior', simplified_mode: true };
    case 'teen':
      return { font_scale: 1.0, theme: 'vibrant', simplified_mode: false };
    case 'baby':
      return { font_scale: 1.0, theme: 'pastel', simplified_mode: false };
    default: {
      const ageGroup = getAdultAgeGroup(birthDate);
      return {
        font_scale: 1.0,
        theme: 'default',
        simplified_mode: false,
        ...(ageGroup ? { age_group: ageGroup } : {}),
      };
    }
  }
}
