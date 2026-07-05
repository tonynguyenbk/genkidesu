// Shared status colors + alert-flag copy for the group dashboard.
// Colors per FEATURE_group_dashboard.md.

export type MemberStatus = 'ok' | 'warn' | 'danger';

export const STATUS_COLORS: Record<MemberStatus, string> = {
  danger: '#E24B4A',
  warn: '#BA7517',
  ok: '#1D9E75',
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  danger: 'Cần chú ý',
  warn: 'Chưa đạt',
  ok: 'Đạt mục tiêu',
};

const FLAG_LABELS: Record<string, string> = {
  low_kcal: 'Thiếu calo nghiêm trọng',
  low_protein: 'Thiếu protein',
  no_lunch: 'Chưa ăn trưa',
  no_meals: 'Chưa ghi nhận bữa nào',
};

export function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] ?? flag;
}
