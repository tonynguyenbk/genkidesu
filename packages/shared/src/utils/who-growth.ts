import type { Gender } from '../types/index.js';

/**
 * Simplified WHO Child Growth Standards (0–24 tháng), nội suy theo tháng tuổi.
 * Mỗi entry là [median, SD] tại các mốc tháng tuổi 0,1,2...24.
 * Nguồn tham khảo: WHO Child Growth Standards 2006 (weight-for-age, length/height-for-age).
 * SD ước lượng từ khoảng cách giữa median và ±1SD trong bảng WHO gốc — đủ cho mục đích
 * phân loại tăng trưởng (không thay thế chẩn đoán y khoa).
 */
interface GrowthPoint {
  median: number;
  sd: number;
}

const WEIGHT_FOR_AGE_BOYS: GrowthPoint[] = [
  { median: 3.3, sd: 0.45 }, { median: 4.5, sd: 0.55 }, { median: 5.6, sd: 0.65 },
  { median: 6.4, sd: 0.7 }, { median: 7.0, sd: 0.75 }, { median: 7.5, sd: 0.8 },
  { median: 7.9, sd: 0.85 }, { median: 8.3, sd: 0.88 }, { median: 8.6, sd: 0.91 },
  { median: 8.9, sd: 0.94 }, { median: 9.2, sd: 0.97 }, { median: 9.4, sd: 1.0 },
  { median: 9.6, sd: 1.03 }, { median: 9.9, sd: 1.06 }, { median: 10.1, sd: 1.09 },
  { median: 10.3, sd: 1.11 }, { median: 10.5, sd: 1.14 }, { median: 10.7, sd: 1.16 },
  { median: 10.9, sd: 1.19 }, { median: 11.1, sd: 1.21 }, { median: 11.3, sd: 1.24 },
  { median: 11.5, sd: 1.26 }, { median: 11.8, sd: 1.29 }, { median: 12.0, sd: 1.31 },
  { median: 12.2, sd: 1.34 },
];

const WEIGHT_FOR_AGE_GIRLS: GrowthPoint[] = [
  { median: 3.2, sd: 0.45 }, { median: 4.2, sd: 0.54 }, { median: 5.1, sd: 0.61 },
  { median: 5.8, sd: 0.67 }, { median: 6.4, sd: 0.72 }, { median: 6.9, sd: 0.76 },
  { median: 7.3, sd: 0.81 }, { median: 7.6, sd: 0.84 }, { median: 7.9, sd: 0.88 },
  { median: 8.2, sd: 0.91 }, { median: 8.5, sd: 0.94 }, { median: 8.7, sd: 0.97 },
  { median: 8.9, sd: 1.0 }, { median: 9.2, sd: 1.03 }, { median: 9.4, sd: 1.06 },
  { median: 9.6, sd: 1.09 }, { median: 9.8, sd: 1.12 }, { median: 10.0, sd: 1.15 },
  { median: 10.2, sd: 1.18 }, { median: 10.4, sd: 1.21 }, { median: 10.6, sd: 1.24 },
  { median: 10.9, sd: 1.27 }, { median: 11.1, sd: 1.3 }, { median: 11.3, sd: 1.33 },
  { median: 11.5, sd: 1.36 },
];

const LENGTH_FOR_AGE_BOYS: GrowthPoint[] = [
  { median: 49.9, sd: 1.9 }, { median: 54.7, sd: 2.0 }, { median: 58.4, sd: 2.1 },
  { median: 61.4, sd: 2.2 }, { median: 63.9, sd: 2.2 }, { median: 65.9, sd: 2.3 },
  { median: 67.6, sd: 2.3 }, { median: 69.2, sd: 2.4 }, { median: 70.6, sd: 2.4 },
  { median: 72.0, sd: 2.5 }, { median: 73.3, sd: 2.5 }, { median: 74.5, sd: 2.6 },
  { median: 75.7, sd: 2.6 }, { median: 76.9, sd: 2.7 }, { median: 78.0, sd: 2.7 },
  { median: 79.1, sd: 2.8 }, { median: 80.2, sd: 2.8 }, { median: 81.2, sd: 2.9 },
  { median: 82.3, sd: 2.9 }, { median: 83.2, sd: 3.0 }, { median: 84.2, sd: 3.0 },
  { median: 85.1, sd: 3.1 }, { median: 86.0, sd: 3.1 }, { median: 86.9, sd: 3.2 },
  { median: 87.8, sd: 3.2 },
];

const LENGTH_FOR_AGE_GIRLS: GrowthPoint[] = [
  { median: 49.1, sd: 1.9 }, { median: 53.7, sd: 2.0 }, { median: 57.1, sd: 2.1 },
  { median: 59.8, sd: 2.1 }, { median: 62.1, sd: 2.2 }, { median: 64.0, sd: 2.3 },
  { median: 65.7, sd: 2.3 }, { median: 67.3, sd: 2.4 }, { median: 68.7, sd: 2.4 },
  { median: 70.1, sd: 2.5 }, { median: 71.5, sd: 2.5 }, { median: 72.8, sd: 2.6 },
  { median: 74.0, sd: 2.6 }, { median: 75.2, sd: 2.7 }, { median: 76.4, sd: 2.7 },
  { median: 77.5, sd: 2.8 }, { median: 78.6, sd: 2.8 }, { median: 79.7, sd: 2.9 },
  { median: 80.7, sd: 2.9 }, { median: 81.7, sd: 3.0 }, { median: 82.7, sd: 3.0 },
  { median: 83.7, sd: 3.1 }, { median: 84.6, sd: 3.1 }, { median: 85.5, sd: 3.2 },
  { median: 86.4, sd: 3.2 },
];

export type GrowthMetric = 'weight' | 'height';

export type GrowthStatus =
  | 'severely_low'
  | 'low'
  | 'normal'
  | 'high'
  | 'severely_high';

export interface GrowthAssessment {
  zScore: number;
  status: GrowthStatus;
  label: string;
  median: number;
}

function tableFor(metric: GrowthMetric, gender: Gender): GrowthPoint[] {
  if (metric === 'weight') {
    return gender === 'female' ? WEIGHT_FOR_AGE_GIRLS : WEIGHT_FOR_AGE_BOYS;
  }
  return gender === 'female' ? LENGTH_FOR_AGE_GIRLS : LENGTH_FOR_AGE_BOYS;
}

/** Nội suy tuyến tính median/SD tại độ tuổi (tháng) bất kỳ trong khoảng 0–24 tháng. */
function interpolate(table: GrowthPoint[], ageMonths: number): GrowthPoint {
  const clamped = Math.min(Math.max(ageMonths, 0), 24);
  const lower = Math.floor(clamped);
  const upper = Math.ceil(clamped);
  if (lower === upper) return table[lower]!;
  const frac = clamped - lower;
  const a = table[lower]!;
  const b = table[upper]!;
  return {
    median: a.median + (b.median - a.median) * frac,
    sd: a.sd + (b.sd - a.sd) * frac,
  };
}

function classify(metric: GrowthMetric, zScore: number): { status: GrowthStatus; label: string } {
  if (metric === 'weight') {
    if (zScore < -3) return { status: 'severely_low', label: 'Suy dinh dưỡng nặng (nhẹ cân)' };
    if (zScore < -2) return { status: 'low', label: 'Suy dinh dưỡng (nhẹ cân)' };
    if (zScore <= 2) return { status: 'normal', label: 'Cân nặng bình thường' };
    if (zScore <= 3) return { status: 'high', label: 'Thừa cân' };
    return { status: 'severely_high', label: 'Béo phì' };
  }
  // height/length-for-age
  if (zScore < -3) return { status: 'severely_low', label: 'Thấp còi nặng' };
  if (zScore < -2) return { status: 'low', label: 'Thấp còi (chiều cao thấp so với tuổi)' };
  if (zScore <= 2) return { status: 'normal', label: 'Chiều cao bình thường' };
  return { status: 'high', label: 'Chiều cao vượt chuẩn' };
}

/**
 * Tính z-score và phân loại tăng trưởng cho bé 0–24 tháng tuổi theo chuẩn WHO.
 * Trả về null nếu ngoài phạm vi áp dụng (>24 tháng) hoặc thiếu dữ liệu.
 */
export function assessGrowth(
  metric: GrowthMetric,
  gender: Gender,
  ageMonths: number,
  value: number,
): GrowthAssessment | null {
  if (ageMonths < 0 || ageMonths > 24) return null;
  const table = tableFor(metric, gender);
  const { median, sd } = interpolate(table, ageMonths);
  if (sd <= 0) return null;
  const zScore = +((value - median) / sd).toFixed(2);
  const { status, label } = classify(metric, zScore);
  return { zScore, status, label, median: +median.toFixed(2) };
}

/** Đường cong median WHO theo tháng tuổi (0–24) — dùng để vẽ biểu đồ tăng trưởng. */
export function getWhoMedianCurve(metric: GrowthMetric, gender: Gender): { ageMonths: number; median: number }[] {
  const table = tableFor(metric, gender);
  return table.map((point, ageMonths) => ({ ageMonths, median: point.median }));
}

export function getAgeMonthsFromBirthDate(birthDate: Date, atDate: Date = new Date()): number {
  const months =
    (atDate.getFullYear() - birthDate.getFullYear()) * 12 +
    (atDate.getMonth() - birthDate.getMonth()) +
    (atDate.getDate() - birthDate.getDate()) / 30.4375;
  return Math.max(0, +months.toFixed(1));
}
