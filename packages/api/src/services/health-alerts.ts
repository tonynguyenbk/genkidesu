import type { DetectedDish } from '../ai/vision.js';

interface HealthConditionRow {
  condition: string;
}

interface AlertRule {
  test: (dishes: DetectedDish[], total: Totals) => boolean;
  message: string;
}

interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const RULES: Record<string, AlertRule[]> = {
  diabetes_type2: [
    {
      test: (_, t) => t.carbsG > 70,
      message: '⚠️ Bữa này nhiều tinh bột (>70g carbs) — theo dõi đường huyết sau ăn',
    },
    {
      test: (dishes) =>
        dishes.some((d) => /bánh|chè|nước ngọt|sinh tố|trà sữa|kẹo|mứt|kem|đường thốt nốt/i.test(d.nameVi)),
      message: '⚠️ Phát hiện thực phẩm nhiều đường — không phù hợp với chế độ tiểu đường',
    },
  ],
  hypertension: [
    {
      test: (dishes) =>
        dishes.some((d) =>
          /mì tôm|mì gói|phở|bún bò|bún riêu|xúc xích|dưa chua|kim chi|khô|mắm|ruốc|chả lụa|pate/i.test(
            d.nameVi,
          ),
        ),
      message: '⚠️ Phát hiện món có thể nhiều muối — chú ý kiểm soát natri với huyết áp cao',
    },
  ],
  gout: [
    {
      test: (dishes) =>
        dishes.some((d) =>
          /hải sản|tôm|cua|ghẹ|mực|bạch tuộc|ốc|sò|tim|gan|thận|lòng|nội tạng|thịt bò|thịt dê|thịt ngựa|trứng cá/i.test(
            d.nameVi,
          ),
        ),
      message: '⚠️ Phát hiện thực phẩm nhiều purin — cần hạn chế khi bị gout',
    },
  ],
  heart_disease: [
    {
      test: (_, t) => t.fatG > 25,
      message: '⚠️ Bữa này nhiều chất béo (>25g) — cần chú ý với bệnh tim mạch',
    },
    {
      test: (dishes) =>
        dishes.some((d) => /chiên|rán|xào|đồ chiên|đồ rán|da gà|mỡ|phủ tạng|lòng đỏ trứng/i.test(d.nameVi)),
      message: '⚠️ Phát hiện món chiên/rán/nhiều mỡ — hạn chế để bảo vệ tim mạch',
    },
  ],
  kidney: [
    {
      test: (_, t) => t.proteinG > 35,
      message: '⚠️ Bữa này nhiều đạm (>35g protein) — cần kiểm soát lượng protein với bệnh thận',
    },
    {
      test: (dishes) =>
        dishes.some((d) => /chuối|cam|bưởi|khoai tây|cà chua|nước dừa/i.test(d.nameVi)),
      message: '⚠️ Một số món có thể nhiều kali — chú ý với bệnh thận mạn',
    },
  ],
};

export function generateHealthAlerts(
  dishes: DetectedDish[],
  conditions: HealthConditionRow[],
): string[] {
  if (!conditions.length || !dishes.length) return [];

  const totals: Totals = dishes.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      proteinG: acc.proteinG + d.proteinG,
      carbsG: acc.carbsG + d.carbsG,
      fatG: acc.fatG + d.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const alerts: string[] = [];
  const seen = new Set<string>();

  for (const { condition } of conditions) {
    const rules = RULES[condition] ?? [];
    for (const rule of rules) {
      if (rule.test(dishes, totals) && !seen.has(rule.message)) {
        alerts.push(rule.message);
        seen.add(rule.message);
      }
    }
  }

  return alerts;
}
