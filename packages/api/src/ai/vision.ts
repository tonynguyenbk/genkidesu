import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  // True when the matched food is expert-verified, false when it's a
  // community-contributed entry → drives "Đã xác minh" vs "Cộng đồng".
  foodVerified?: boolean;
  // True when the AI read the values off a visible nutrition-facts label —
  // that's ground truth, so the RAG override is skipped for these dishes.
  fromLabel?: boolean;
  // Per-portion micronutrients pulled from the verified foods DB on RAG match
  // (e.g. { sodium_mg: 480, calcium_mg: 25, fiber_g: 2 }). Absent when no match.
  micronutrients?: Record<string, number>;
  // True when the matched food's micronutrients are curated, false when
  // AI-estimated → drives the "Đã xác minh" vs "Ước tính" label.
  microVerified?: boolean;
}

export interface VisionResult {
  dishes: DetectedDish[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  alerts: string[];
  processingMs: number;
  fromMock?: boolean; // true khi không có AI key hoặc AI bị lỗi
}

const anthropicClient = process.env['ANTHROPIC_API_KEY']
  ? new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] })
  : null;

const geminiClient = process.env['GOOGLE_GEMINI_API_KEY']
  ? new GoogleGenerativeAI(process.env['GOOGLE_GEMINI_API_KEY'])
  : null;

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
      "confidence": 0.92,
      "fromLabel": false
    }
  ]
}

Quy tắc nhận diện:
- nameVi: tên món cụ thể, đúng vùng miền (vd "Phở bò tái", "Bún bò Huế", không chỉ "Phở")
- confidence: 0.0-1.0 (mức độ chắc chắn khi nhận diện món)
- Nếu không thấy món ăn nào, trả về {"dishes": []}
- Tập trung vào món ăn Việt Nam

QUAN TRỌNG — Ước lượng khẩu phần (portionG) chính xác bằng cách dùng vật tham chiếu trong ảnh:
- Tô/bát ăn phở thường: nước + cái ≈ 400-600g
- Đĩa cơm đầy: cơm ≈ 200-300g (chưa tính thức ăn kèm)
- Chén/bát cơm nhỏ: ≈ 100-150g cơm
- Ổ bánh mì: ≈ 120-180g
- Ly/cốc đồ uống: 250ml ≈ 250g, 500ml ≈ 500g
- Dùng đũa, thìa, đĩa, bàn tay làm thước đo tỉ lệ kích thước món
- Nếu món chỉ chiếm 1 phần đĩa/tô, ước lượng theo tỉ lệ thực tế nhìn thấy
- portionG là gram thực tế NHÌN THẤY trong ảnh, không phải khẩu phần tiêu chuẩn

Quy tắc dinh dưỡng:
- calories: tổng calo của đúng khẩu phần portionG ở trên
- protein/carbs/fat: tính theo gram cho đúng khẩu phần portionG (không phải per 100g)

QUAN TRỌNG — Sản phẩm đóng gói (snack, bánh kẹo, sữa, đồ uống đóng chai/hộp...):
- Nếu trong ảnh NHÌN THẤY bảng "Giá trị dinh dưỡng" / "Nutrition Facts": BẮT BUỘC dùng đúng số liệu in trên nhãn (không tự ước lượng) và đặt "fromLabel": true cho món đó
- Chú ý nhãn thường ghi cho 1 khẩu phần nhỏ (vd "trong 30 g") — phải quy đổi theo portionG thực tế
- Nếu bao bì ghi khối lượng tịnh (NET WT / khối lượng tịnh) và người dùng chụp nguyên gói: dùng khối lượng tịnh làm portionG
- Lấy tên món theo đúng tên sản phẩm + thương hiệu in trên bao bì
- Nếu là hàng đóng gói nhưng KHÔNG thấy bảng dinh dưỡng: ước lượng như bình thường, đặt "fromLabel": false`;

function buildVisionResult(dishes: DetectedDish[], start: number): VisionResult {
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
  return { dishes, ...total, alerts, processingMs: Date.now() - start };
}

function parseJsonResponse(text: string): DetectedDish[] {
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match?.[0] ?? '{"dishes":[]}') as { dishes: DetectedDish[] };
  return parsed.dishes ?? [];
}

// Free-tier daily quota is per-model, so fall through to the next model when one
// is exhausted (429) or temporarily overloaded (503).
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

async function analyzeWithGemini(imageInput: string): Promise<DetectedDish[]> {
  const [meta, data] = imageInput.startsWith('data:') ? imageInput.split(',') : ['', ''];
  const mimeType = imageInput.startsWith('data:')
    ? (meta?.split(';')[0]?.split(':')[1] ?? 'image/jpeg')
    : 'image/jpeg';

  const contents = imageInput.startsWith('data:')
    ? [{ inlineData: { mimeType, data: data ?? '' } }, FOOD_RECOGNITION_PROMPT]
    : [{ fileData: { mimeType, fileUri: imageInput } }, FOOD_RECOGNITION_PROMPT];

  let lastErr: unknown;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = geminiClient!.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contents as Parameters<typeof model.generateContent>[0]);
      console.log(`[AI] Gemini model: ${modelName}`);
      return parseJsonResponse(result.response.text());
    } catch (err) {
      lastErr = err;
      console.warn(`[AI] ${modelName} failed, trying next:`, (err as Error).message);
    }
  }
  throw lastErr;
}

async function analyzeWithClaude(imageInput: string): Promise<DetectedDish[]> {
  let imageContent: Anthropic.ImageBlockParam['source'];
  if (imageInput.startsWith('data:')) {
    const [meta, data] = imageInput.split(',');
    const mediaType = (meta?.split(';')[0]?.split(':')[1] ?? 'image/jpeg') as
      'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    imageContent = { type: 'base64', media_type: mediaType, data: data ?? '' };
  } else {
    imageContent = { type: 'url', url: imageInput };
  }

  const response = await anthropicClient!.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    // JSON extraction only — skip adaptive thinking (on by default on Sonnet 5)
    // to keep latency and cost down for the fallback path.
    thinking: { type: 'disabled' },
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
  return parseJsonResponse(text);
}

export async function analyzeFoodImage(imageInput: string): Promise<VisionResult> {
  const start = Date.now();

  // Priority: Gemini → Claude → Mock
  if (geminiClient) {
    try {
      console.log('[AI] Using Gemini 2.0 Flash');
      const dishes = await analyzeWithGemini(imageInput);
      return buildVisionResult(dishes, start);
    } catch (err) {
      console.error('[AI] Gemini error, falling back:', err);
    }
  }

  if (anthropicClient) {
    try {
      console.log('[AI] Using Claude Sonnet');
      const dishes = await analyzeWithClaude(imageInput);
      return buildVisionResult(dishes, start);
    } catch (err) {
      console.error('[AI] Claude error, falling back to mock:', err);
    }
  }

  console.log('[AI] No API key configured — using mock response');
  return { ...getMockResponse(start), fromMock: true };

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
