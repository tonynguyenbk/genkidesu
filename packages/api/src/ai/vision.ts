export interface DetectedDish {
  nameVi: string;
  nameEn: string;
  portionG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number;
  foodId?: string;
}

export interface VisionResult {
  dishes: DetectedDish[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  alerts: string[];
  processingMs: number;
}

// Mock AI responses — will be replaced with real Claude Vision call in Sprint 2
const MOCK_RESPONSES: DetectedDish[][] = [
  [
    {
      nameVi: 'Phở bò tái', nameEn: 'Beef pho (rare)', portionG: 500,
      calories: 420, proteinG: 28, carbsG: 52, fatG: 8, confidence: 0.92,
    },
    {
      nameVi: 'Giá đỗ', nameEn: 'Bean sprouts', portionG: 30,
      calories: 10, proteinG: 1, carbsG: 1.5, fatG: 0.1, confidence: 0.88,
    },
  ],
  [
    {
      nameVi: 'Cơm tấm sườn', nameEn: 'Broken rice with grilled pork', portionG: 400,
      calories: 580, proteinG: 32, carbsG: 72, fatG: 16, confidence: 0.89,
    },
    {
      nameVi: 'Trứng ốp la', nameEn: 'Sunny side up egg', portionG: 50,
      calories: 90, proteinG: 6, carbsG: 0.4, fatG: 7, confidence: 0.95,
    },
  ],
  [
    {
      nameVi: 'Bánh mì thịt', nameEn: 'Pork banh mi', portionG: 150,
      calories: 320, proteinG: 16, carbsG: 42, fatG: 9, confidence: 0.91,
    },
  ],
  [
    {
      nameVi: 'Bún bò Huế', nameEn: 'Hue beef noodle soup', portionG: 500,
      calories: 460, proteinG: 30, carbsG: 55, fatG: 12, confidence: 0.87,
    },
  ],
  [
    {
      nameVi: 'Cơm chiên dương châu', nameEn: 'Yangzhou fried rice', portionG: 300,
      calories: 480, proteinG: 18, carbsG: 65, fatG: 14, confidence: 0.85,
    },
    {
      nameVi: 'Canh chua cá', nameEn: 'Sour fish soup', portionG: 250,
      calories: 120, proteinG: 14, carbsG: 8, fatG: 4, confidence: 0.82,
    },
  ],
];

export async function analyzeFoodImage(_imageUrl: string): Promise<VisionResult> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

  const dishes = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]!;

  const total = dishes.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      proteinG: acc.proteinG + d.proteinG,
      carbsG: acc.carbsG + d.carbsG,
      fatG: acc.fatG + d.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const alerts: string[] = [];
  if (total.calories > 700) alerts.push('Bữa ăn này nhiều calo, hãy chú ý lượng ăn.');
  if (total.proteinG < 15) alerts.push('Thiếu protein — thêm thịt, trứng hoặc đậu vào bữa ăn.');

  return {
    dishes,
    ...total,
    alerts,
    processingMs: Math.round(1500 + Math.random() * 1000),
  };
}
