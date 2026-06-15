import Anthropic from '@anthropic-ai/sdk';

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
  matchedFood?: boolean;
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

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const FOOD_RECOGNITION_PROMPT = `Bạn là chuyên gia dinh dưỡng Việt Nam. Hãy nhận diện tất cả món ăn trong ảnh này.

Với mỗi món, trả về JSON theo format sau (KHÔNG thêm text nào khác ngoài JSON):
{
  "dishes": [
    {
      "nameVi": "Tên tiếng Việt",
      "nameEn": "English name",
      "portionG": 300,
      "calories": 450,
      "proteinG": 25.5,
      "carbsG": 55.0,
      "fatG": 12.0,
      "confidence": 0.92
    }
  ]
}

Quy tắc:
- portionG: ước tính khẩu phần thực tế trong ảnh (gram)
- calories: tổng calo của khẩu phần đó
- protein/carbs/fat: tính theo gram của khẩu phần
- confidence: 0.0-1.0 (mức độ chắc chắn khi nhận diện)
- Nếu không thấy món ăn nào, trả về {"dishes": []}
- Tập trung vào món ăn Việt Nam`;

export async function analyzeFoodImage(imageInput: string): Promise<VisionResult> {
  const start = Date.now();

  // If no API key, use mock
  if (!process.env['ANTHROPIC_API_KEY']) {
    console.log('[AI] No ANTHROPIC_API_KEY — using mock response');
    return getMockResponse(start);
  }

  try {
    // imageInput can be a data URL (base64) or URL
    let imageContent: Anthropic.ImageBlockParam['source'];

    if (imageInput.startsWith('data:')) {
      const [meta, data] = imageInput.split(',');
      const mediaType = (meta?.split(';')[0]?.split(':')[1] ?? 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      imageContent = { type: 'base64', media_type: mediaType, data: data ?? '' };
    } else {
      imageContent = { type: 'url', url: imageInput };
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: imageContent },
            { type: 'text', text: FOOD_RECOGNITION_PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{"dishes":[]}';
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{"dishes":[]}') as {
      dishes: DetectedDish[];
    };

    const dishes = parsed.dishes ?? [];
    const total = dishes.reduce(
      (acc, d) => ({
        totalCalories: acc.totalCalories + d.calories,
        totalProteinG: acc.totalProteinG + d.proteinG,
        totalCarbsG: acc.totalCarbsG + d.carbsG,
        totalFatG: acc.totalFatG + d.fatG,
      }),
      { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 },
    );

    const alerts: string[] = [];
    if (total.totalCalories > 800) alerts.push('Bữa ăn nhiều calo, hãy chú ý khẩu phần.');
    if (total.totalProteinG < 15) alerts.push('Bữa ăn thiếu protein — thêm thịt, trứng hoặc đậu.');

    return {
      dishes,
      ...total,
      alerts,
      processingMs: Date.now() - start,
    };
  } catch (err) {
    console.error('[AI] Vision error:', err);
    return getMockResponse(start);
  }
}

// Fallback mock responses for dev/testing
const MOCK_MEALS: DetectedDish[][] = [
  [
    { nameVi: 'Phở bò tái', nameEn: 'Beef pho (rare)', portionG: 500, calories: 420, proteinG: 28, carbsG: 52, fatG: 8, confidence: 0.92 },
    { nameVi: 'Giá đỗ luộc', nameEn: 'Bean sprouts', portionG: 30, calories: 10, proteinG: 1, carbsG: 1.5, fatG: 0.1, confidence: 0.88 },
  ],
  [
    { nameVi: 'Cơm tấm sườn nướng', nameEn: 'Broken rice with grilled pork', portionG: 400, calories: 580, proteinG: 32, carbsG: 72, fatG: 16, confidence: 0.89 },
    { nameVi: 'Trứng ốp la', nameEn: 'Sunny-side up egg', portionG: 50, calories: 90, proteinG: 6, carbsG: 0.4, fatG: 7, confidence: 0.95 },
  ],
  [
    { nameVi: 'Bún bò Huế', nameEn: 'Hue beef noodle soup', portionG: 500, calories: 460, proteinG: 30, carbsG: 55, fatG: 12, confidence: 0.87 },
  ],
  [
    { nameVi: 'Bánh mì thịt', nameEn: 'Vietnamese pork banh mi', portionG: 150, calories: 320, proteinG: 16, carbsG: 42, fatG: 9, confidence: 0.91 },
  ],
];

function getMockResponse(start: number): VisionResult {
  const dishes = MOCK_MEALS[Math.floor(Math.random() * MOCK_MEALS.length)]!;
  const total = dishes.reduce(
    (acc, d) => ({
      totalCalories: acc.totalCalories + d.calories,
      totalProteinG: acc.totalProteinG + d.proteinG,
      totalCarbsG: acc.totalCarbsG + d.carbsG,
      totalFatG: acc.totalFatG + d.fatG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0 },
  );
  return { dishes, ...total, alerts: [], processingMs: Date.now() - start };
}
