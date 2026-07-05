# GENKI — Ghi chú độ chính xác AI nhận diện món ăn

> Cập nhật: 17/06/2026
> Liên quan: `packages/api/src/ai/` (vision, rag, prompts), màn hình `apps/mobile/app/meal/result.tsx`

## Kỳ vọng thực tế: AI KHÔNG đoán đúng 100%

AI vision (Gemini 2.5 Flash hiện tại) **không** nhận diện chính xác mọi ảnh. Đây là
giới hạn của cả ngành, không riêng Genki.

### Đoán tốt với
- Món Việt phổ biến, rõ ràng: phở, bánh mì, cơm tấm, bún bò... (test thực tế: bánh mì 98%, phở bò 87%)
- Ảnh chụp rõ, đủ sáng, thấy toàn bộ món

### Hay sai ở
- **Khẩu phần (gram)** — sai nhiều nhất. AI nhìn ảnh 2D khó ước lượng khối lượng → calo lệch ±20-30%
- Món nhìn giống nhau (bún riêu vs bún bò, các loại chè...)
- Món địa phương hiếm, món tự nấu lạ
- Ảnh mờ, thiếu sáng, bị che khuất

### Vì sao chấp nhận được
- Màn hình kết quả AI **cho phép user sửa**: chỉnh khẩu phần, xóa/thêm món, đổi loại bữa
  trước khi lưu. AI là điểm khởi đầu, không phải con số tuyệt đối.
- KPI mục tiêu (theo product spec §9): độ chính xác **≥75% (beta) → ≥82% (launch) → ≥88% (PMF)**.
  Kể cả khi trưởng thành vẫn chấp nhận ~12% sai.
- Đối thủ SnapCalorie dùng cả LIDAR 3D vẫn sai 16%.

## Hai đòn bẩy tăng độ chính xác (ĐÃ BẬT 17/06/2026)

### 1. RAG matching (`packages/api/src/ai/rag.ts`)
Khớp món AI nhận diện với database ~198 món Việt đã verify (qua pgvector cosine
similarity), lấy số dinh dưỡng chuẩn per-100g thay vì để AI tự đoán macro. Giữ lại
`portionG` + `confidence` từ AI, chỉ thay số dinh dưỡng bằng dữ liệu verified khi
similarity ≥ ngưỡng. Cần backfill embedding cho foods table (`pnpm --filter db embed`).

### 2. Prompt engineering (`packages/api/src/ai/vision.ts` — FOOD_RECOGNITION_PROMPT)
Thêm hướng dẫn ước lượng khẩu phần dựa trên vật tham chiếu trong ảnh (tô, đĩa, đũa,
thìa) để giảm sai số phần khẩu phần — phần yếu nhất của AI.

## Vi chất dinh dưỡng — "Xem thêm vi chất" (thêm 17/06/2026)

Hiển thị vi chất (Natri, Chất xơ, Canxi, Sắt, Kẽm, các Vitamin...) trong khối gập/mở
"Xem thêm vi chất" ở màn kết quả AI (`apps/mobile/app/meal/result.tsx`) và chi tiết bữa
(`apps/mobile/app/meal/[type].tsx`).

**Nguyên tắc quan trọng: KHÔNG để AI đoán vi chất.** Vitamin/khoáng theo mg/mcg gần như
không thể ước lượng chính xác từ ảnh. Thay vào đó lấy từ DB món đã verify qua RAG match:
- `applyFoodMatch` (`packages/api/src/ai/rag.ts`) kéo `micronutrients_per_100g` + `fiber_per_100g`
  từ món khớp, scale theo khẩu phần, gắn vào `dish.micronutrients`.
- Lưu vào `meal_items.micronutrients` khi confirm; `updateItemPortion` co giãn theo khẩu phần.
- UI gộp vi chất tất cả món, sắp ưu tiên Natri/Chất xơ (điểm nóng) → khoáng → vitamin
  (`apps/mobile/lib/micronutrients.ts`). Chỉ hiện chất có dữ liệu thật.

**Độ phủ dữ liệu**: 84/198 món có vi chất trong DB (field không đồng nhất giữa các món).
Món chưa có data → khối "Xem thêm vi chất" không hiện. Cần bổ sung seed dần.

## Chất lượng data seed — món nước (sửa 17/06/2026)

Phát hiện: nhiều món **nước có sợi** (phở, bún, hủ tiếu, miến, mì, bánh đa) và **lẩu** bị
seed `cal_per_100g` theo nước dùng loãng (~42-68), thực tế tô đầy đủ phải ~70-95. Vì RAG
match ghi đè calo AI bằng data DB nên data sai làm kết quả sai (vd Phở bò 500g chỉ ra 230
kcal thay vì ~400).

Đã sửa **19 món** bằng giá trị curated (scale macro theo tỉ lệ giữ cân đối): Phở bò 80,
Bún bò Huế 90, Hủ tiếu 90, Phở gà 75... → tô ra ~375-450 kcal đúng thực tế. **Lưu ý**: chỉ
sửa data `foods`; các `meal_logs` đã ghi trước đó giữ số cũ (cần scan lại để thấy số mới).
Món **canh** (canh chua/cua...) và **đồ uống** loãng vẫn để thấp — đó là đúng.

Script AI làm lại nutrition cho món mới khi cần: `pnpm --filter db fix-dish-nutrition`
(`packages/db/seed/fix-dish-nutrition.ts`, lọc category breakfast/main_dish, portion≥400, cal<75).

## Timezone — định nghĩa "ngày" theo giờ VN (sửa 17/06/2026)

Bug: `daily_summaries.summary_date` tính bằng `setHours(0,0,0,0)` theo giờ **server**
(UTC), lệch 1 ngày so với ngày thật của log → màn Thống kê đọc summary ra 0 dù có bữa.

Giải pháp: helper `packages/api/src/utils/day.ts` định nghĩa ngày theo **app timezone
(UTC+7, override bằng `APP_TZ_OFFSET_MINUTES`)**:
- `localDateKey(instant)` → Date UTC-midnight của ngày VN (lưu vào cột `@db.Date`).
- `localDayRange(instant)` → mốc UTC `[start,end]` của ngày VN (lọc `logged_at`).

Áp dụng nhất quán cho `meal.getDailyLogs/getDailySummary/getWeeklySummaries`,
`recomputeDailySummary`, và `family.getDashboard`. Home + Thống kê tính trực tiếp từ logs
nên đã miễn nhiễm; summary table dùng cho dashboard/tuần.

Recompute lại toàn bộ summary cũ: `pnpm --filter db recompute-summaries`
(`packages/db/seed/recompute-summaries.ts` — xóa hết rồi dựng lại theo ngày VN từ meal_logs).

## Giới hạn quota Gemini free tier (quan trọng)

- Quota tính **theo từng model mỗi ngày** (`GenerateRequestsPerDayPerProjectPerModel`).
  gemini-2.5-flash RPD nhỏ, dùng chung với scan ảnh → bulk job (fill vi chất, fix nutrition)
  dễ làm cạn quota khiến scan rớt về mock.
- Giải pháp: vision.ts fallback chain `gemini-2.5-flash → gemini-2.5-flash-lite` (quota riêng);
  bulk script dùng flash-lite + retry backoff. Nhưng nếu chạy nhiều, cả 2 model có thể cạn
  trong ngày → phải chờ reset (nửa đêm Pacific).
- Fill vi chất hiện mới ~104/198 món (quota cạn giữa chừng). Chạy lại khi quota hồi:
  `pnpm --filter db fill-micro` (idempotent, chỉ điền món còn NULL).

## Lưu ý vận hành
- Gemini free tier: model `gemini-2.0-flash` / `gemini-2.0-flash-lite` bị quota = 0 cho
  project này → phải dùng `gemini-2.5-flash`. Thời gian phản hồi thật ~2-14 giây (mock chỉ ~300ms).
- Kết quả mock (khi thiếu API key / AI lỗi) có cờ `fromMock: true` và KHÔNG được cache
  (tránh lưu nhầm số liệu giả) — xem `packages/api/src/ai/cache.ts`.
- RAG embedding dùng `gemini-embedding-001` (1536 chiều, cùng key Gemini), ngưỡng similarity
  0.75. Backfill: `pnpm --filter db embed` (`packages/db/seed/embed-foods.ts`).
