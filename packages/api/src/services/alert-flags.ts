import { localHour } from '../utils/day.js';

// Per-member nutrition status + flags for the group dashboard. Computed
// server-side (not on the client) so the same logic can drive push
// notifications later. See FEATURE_group_dashboard.md.

export type MemberStatus = 'ok' | 'warn' | 'danger';

export interface AlertInput {
  targetKcal: number;
  actualKcal: number;
  proteinG: number;
  targetProteinG: number;
  mealTypes: string[]; // meal_type of every confirmed meal today
  now?: Date; // defaults to current instant; used to evaluate time-of-day rules
}

export interface AlertResult {
  status: MemberStatus;
  progressPct: number; // Math.round(actual/target*100)
  alertFlags: string[]; // e.g. ['low_kcal', 'low_protein', 'no_lunch']
}

const LUNCH_HOUR = 13; // a day with no lunch-ish meal past this hour is flagged

export function computeMemberStatus(input: AlertInput): AlertResult {
  const { targetKcal, actualKcal, proteinG, targetProteinG, mealTypes } = input;
  const hour = localHour(input.now ?? new Date());

  const progressPct = targetKcal > 0 ? Math.round((actualKcal / targetKcal) * 100) : 0;
  const noMeals = mealTypes.length === 0;
  const hasLunch = mealTypes.includes('lunch');
  const lowKcal = targetKcal > 0 && actualKcal < targetKcal * 0.4;
  const lowProtein = targetProteinG > 0 && proteinG < targetProteinG * 0.5;

  const flags: string[] = [];
  if (lowKcal) flags.push('low_kcal');
  if (lowProtein) flags.push('low_protein');
  if (noMeals) flags.push('no_meals');
  else if (!hasLunch && hour >= LUNCH_HOUR) flags.push('no_lunch');

  // Status (severity order): danger > warn > ok.
  let status: MemberStatus;
  if (lowKcal || (noMeals && hour >= LUNCH_HOUR)) {
    status = 'danger';
  } else if (progressPct < 80 || lowProtein) {
    status = 'warn';
  } else {
    status = 'ok';
  }

  return { status, progressPct, alertFlags: flags };
}

// Sort key so the member list surfaces who needs attention first.
export function statusRank(status: MemberStatus): number {
  return status === 'danger' ? 0 : status === 'warn' ? 1 : 2;
}
