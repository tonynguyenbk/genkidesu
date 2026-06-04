# GENKI (元気) — Nền tảng dinh dưỡng gia đình Việt Nam

> **Tên app**: Genki — tiếng Nhật nghĩa là "khỏe mạnh, tràn đầy năng lượng"
> **Tagline**: "Genki mỗi ngày" / "Cả nhà Genki"

> **Tài liệu sản phẩm & kỹ thuật — Dành cho dev team**
> Cập nhật: 04/06/2026
> Vai trò: CEO (nhà đầu tư) + PM/Senior Fullstack (kiến trúc & lead dev)

---

## 0. CÁC QUYẾT ĐỊNH ĐÃ CHỐT

| # | Quyết định | Lý do | Ngày |
|---|---|---|---|
| 1 | Tên app: **Genki (元気)** | Dễ đọc mọi lứa tuổi, gợi sức khỏe/năng lượng, văn hóa Nhật = uy tín, chưa ai dùng ở VN | 04/06/2026 |
| 2 | Build strategy: **Phương án B — Expo Universal** | 1 codebase → iOS + Android + Web. Không build web riêng (Vite). 80% effort mobile, 20% web tuning | 04/06/2026 |
| 3 | Không chuyển sang native (Swift/Kotlin) | React Native đã là native (UIKit/Android View). Instagram 2B users vẫn dùng RN. Genki không cần 3D/AR | 04/06/2026 |
| 4 | Không cạnh tranh trực diện với Wao | Wao có 1.5M users, rating 4.8. Ta đi hướng "platform gia đình đa thế hệ" — điều Wao không làm | 04/06/2026 |
| 5 | Build persona "người lớn" trước | Người lớn 25-40 tuổi là entry point → tự nhiên mời bố mẹ + tạo hồ sơ cho con. Baby/senior ở Phase 2 | 04/06/2026 |
| 6 | Tech stack: TS + Expo + Fastify + tRPC + PostgreSQL + Claude API | Team nhỏ, 1 ngôn ngữ (TypeScript) xuyên suốt, type-safe end-to-end, dev VN dễ tuyển | 04/06/2026 |
| 7 | Pricing: Free (3 ảnh/ngày) / Pro 59k / Gia đình 129k | Rẻ hơn Wao (79k), rẻ hơn MFP 10x. Đủ để có doanh thu thực | 04/06/2026 |

---

## 1. TẦM NHÌN SẢN PHẨM

### 1.1. Mô tả ngắn
Ứng dụng dinh dưỡng dựa trên AI chụp ảnh bữa ăn, phục vụ mọi thành viên trong gia đình Việt Nam — từ em bé sơ sinh đến ông bà. Hỗ trợ theo dõi lượng kcal, chất dinh dưỡng thiết yếu, kết nối với thiết bị tập luyện, và tư vấn dinh dưỡng cá nhân hóa.

### 1.2. Tầm nhìn dài hạn
Trở thành **nền tảng dinh dưỡng gia đình số 1 Việt Nam**, sau đó mở rộng ra Đông Nam Á. Không chỉ là app đếm calo — mà là trợ lý sức khỏe gia đình thông minh.

### 1.3. Platforms
- iOS (iPhone, iPad)
- Android
- Web app (PWA) — chạy trên laptop/desktop qua trình duyệt
- Đồng bộ realtime giữa tất cả thiết bị

---

## 2. PHÂN TÍCH THỊ TRƯỜNG & ĐỐI THỦ

### 2.1. Quy mô thị trường
- Thị trường toàn cầu (nutrition tracking): ~$3 tỷ USD (2025), dự kiến $8 tỷ USD (2033), CAGR 14.5%
- Asia-Pacific là khu vực tăng trưởng nhanh nhất
- Việt Nam: ~$150M, 6M+ lượt tải app fitness, 76% mobile internet penetration

### 2.2. Đối thủ quốc tế

#### Cal AI (đối thủ trực tiếp nguy hiểm nhất)
- $34M ARR, 17 nhân viên, bootstrap
- 700k+ lượt tải/tháng
- Dùng Claude + GPT-4o Vision
- Vừa bị MyFitnessPal mua lại (03/2026)
- **Không có**: web app, dữ liệu món Việt
- Giá: ~$10/tháng

#### SnapCalorie
- Dùng LIDAR 3D, sai số chỉ 16% (tốt nhất ngành)
- Founder từ Google Lens
- Miễn phí hoàn toàn
- **Không có**: hỗ trợ món Á, Android support tốt

#### MyFitnessPal
- 200M+ người dùng, database 14M+ thực phẩm
- Tích hợp 50+ app fitness
- **Nhược điểm**: $20-25/tháng (quá đắt cho VN), UI cũ, nhiều quảng cáo

### 2.3. Đối thủ trong nước

#### Wao (đối thủ chính — cần theo dõi chặt)
- **1,5 triệu người dùng**, Top #1 App Store VN
- Database 20.000+ món Việt
- Có AI chụp ảnh (mới, chưa rõ độ chính xác)
- Rating 4.8/5 (824 đánh giá)
- Giá: 79k/tháng hoặc 599k/năm
- **Định vị**: Phụ nữ giảm cân
- **Không có**: web app, wearable sync rõ ràng, hồ sơ gia đình, hỗ trợ gym/thể thao chuyên sâu, dinh dưỡng theo bệnh lý

#### Caloer
- 240.000 lượt tải, 530 lượt tải/ngày
- Google Fit kết nối nhưng KHÔNG hoạt động (user phàn nàn)
- Rating thấp (2-3/5), nhiều bug
- **Không có**: AI chụp ảnh, web app

#### Calz
- Mới ra mắt, 10.000+ thực phẩm
- AI chụp ảnh cơ bản
- Chưa có nhiều user base

### 2.4. Khoảng trống chiến lược (lợi thế của chúng ta)

| Khoảng trống | Chi tiết |
|---|---|
| Platform gia đình | **KHÔNG AI** đang làm app gia đình đa thế hệ tại VN |
| Web app | Cal AI, SnapCalorie, Wao, Caloer đều KHÔNG có web app |
| Wearable sync thật sự | Caloer fail, Wao chưa rõ — đây là cơ hội |
| Người tập gym VN | Wao phục vụ phụ nữ giảm cân, gym thủ đang dùng MFP tiếng Anh |
| Dinh dưỡng bệnh lý | VN có ~7 triệu người tiểu đường, phân khúc hoàn toàn bỏ ngỏ |
| Giá cả | MFP $20/tháng quá đắt, Wao 79k/tháng — ta vào ở 59k/tháng |

---

## 3. CHIẾN LƯỢC SẢN PHẨM

### 3.1. Định vị: "Nền tảng dinh dưỡng gia đình"
- KHÔNG cạnh tranh trực diện với Wao ở phân khúc "phụ nữ giảm cân"
- Xây platform gia đình — điều không ai đang làm
- Điểm vào: người lớn 25-40 tuổi → tự nhiên mời bố mẹ già + lập hồ sơ cho con
- Viral loop nội tại trong gia đình

### 3.2. Bốn persona người dùng

#### Persona 1: Em bé & trẻ nhỏ (0-12 tuổi)
- **Người dùng thật**: Bố mẹ (dùng thay)
- **Nhu cầu**: Theo dõi dinh dưỡng cho con, chuẩn WHO theo tháng tuổi
- **Tính năng chính**: Nhật ký ăn dặm/sữa, biểu đồ tăng trưởng, cảnh báo thiếu vi chất (sắt, canxi, D3), chia sẻ với bác sĩ nhi
- **Người trả tiền**: Bố mẹ

#### Persona 2: Thanh thiếu niên (13-22 tuổi)
- **Nhu cầu**: Ăn uống lành mạnh, kiểm soát cân nặng, áp lực ngoại hình
- **Tính năng chính**: Giao diện Gen Z (nhanh, đơn giản), streak & gamification, phát hiện rối loạn ăn uống, kết nối bố mẹ (tùy chọn, có quyền riêng tư)
- **Kênh tăng trưởng**: Viral qua mạng xã hội

#### Persona 3: Người lớn (23-55 tuổi) — PERSONA CHÍNH, BUILD TRƯỚC
- **Nhu cầu**: Gym, giảm cân, ăn uống khoa học, theo dõi macro chuyên sâu
- **Tính năng chính**: AI chụp ảnh tức thì, macro & micro tracking, sync wearable (Apple Health/Garmin/Strava), web app cho văn phòng, tính TDEE theo hoạt động thực tế
- **Revenue**: Subscription chính

#### Persona 4: Người cao tuổi (55+ tuổi)
- **Nhu cầu**: Dinh dưỡng theo bệnh lý (tiểu đường, huyết áp, tim mạch, gout)
- **Tính năng chính**: Chữ to (18-22px), giao diện siêu đơn giản (2 bước là xong), cảnh báo thực phẩm kiêng kỵ, nhắc uống thuốc, con cái theo dõi từ xa
- **Người trả tiền**: Con cái trả phí cho bố mẹ

### 3.3. Mô hình tài khoản gia đình
- 1 tài khoản chủ (bố hoặc mẹ) + các hồ sơ (profile) thành viên
- Mỗi thành viên có giao diện riêng tối ưu theo nhóm tuổi (adaptive UI)
- Quyền riêng tư: teen có thể ẩn chi tiết với bố mẹ
- Dashboard gia đình: bố mẹ xem tổng quan tất cả

### 3.4. Pricing

| Gói | Giá | Tính năng |
|---|---|---|
| Miễn phí | 0đ | 3 ảnh/ngày, nhật ký 7 ngày, kcal + 3 macro |
| Pro | 59.000 VND/tháng | Không giới hạn ảnh, AI tư vấn, 15+ vi chất, wearable sync, báo cáo tuần/tháng |
| Gia đình | 129.000 VND/tháng | Tất cả Pro × 4 thành viên, dashboard gia đình, mục tiêu riêng từng người |

---

## 4. TECH STACK

### 4.1. Frontend — Expo Universal (React Native + Web)
```
Framework:      Expo SDK 52+ (universal — iOS, Android, Web từ 1 codebase)
Language:       TypeScript (strict mode)
Navigation:     Expo Router v4
State:          Zustand (client state) + TanStack Query (server state)
API client:     tRPC client (type-safe end-to-end)
UI library:     Custom design system (4 themes cho 4 persona)
Web:            Expo Web (Metro bundler) — tự động từ cùng codebase, không cần app riêng
```

**Chiến lược build: Phương án B — Expo Universal**
- 1 codebase duy nhất xuất ra iOS + Android + Web
- 80% effort tập trung mobile (camera, push, HealthKit)
- 20% effort tuning web (responsive layout, file upload thay camera)
- Web chạy như PWA — cài được lên desktop không cần Store

**Lý do chọn React Native/Expo thay vì Flutter:**
- Cùng TypeScript với backend → 1 ngôn ngữ cho cả team
- Web PWA trưởng thành hơn Flutter Web
- Dev Việt Nam biết React nhiều hơn Dart (dễ tuyển)
- Ecosystem npm khổng lồ

### 4.2. Backend — Node.js + Fastify + tRPC
```
Runtime:        Node.js 22 LTS
Framework:      Fastify 5
API layer:      tRPC v11 (type-safe, không cần REST/GraphQL)
Validation:     Zod
Job queue:      BullMQ (xử lý AI processing, push, export async)
Cache:          Redis 7
Auth:           Supabase Auth (Google/Apple/SĐT)
File storage:   Cloudflare R2 (ảnh bữa ăn)
```

**Lý do chọn Fastify + tRPC thay vì NestJS:**
- Ít boilerplate, nhanh hơn Express/NestJS
- tRPC: type-safe 100% end-to-end, không cần viết API docs
- Team nhỏ (4 người) → ưu tiên tốc độ dev

### 4.3. Database — PostgreSQL
```
Primary DB:     PostgreSQL 16
ORM:            Prisma 6
Vector search:  pgvector (cho RAG pipeline)
Time-series:    TimescaleDB extension (nhật ký ăn uống)
Cache/Session:  Redis 7
```

**Lý do chọn PostgreSQL thay vì MongoDB:**
- Quan hệ gia đình phức tạp cần relational DB
- pgvector thay thế vector DB riêng (Pinecone, Weaviate)
- ACID transaction cho dữ liệu y tế là bắt buộc
- TimescaleDB tích hợp sẵn cho time-series

### 4.4. AI — Claude Vision API + RAG
```
Primary model:  Claude Sonnet (claude-sonnet-4-20250514) Vision
Fallback:       GPT-4o Vision
Technique:      RAG (Retrieval-Augmented Generation) với DB món Việt
Embedding:      pgvector trong PostgreSQL
Fine-tune:      Custom model sau 6 tháng (khi có đủ dữ liệu feedback)
```

**AI abstraction layer (QUAN TRỌNG):**
- Gọi AI qua abstraction layer (`packages/api/ai/vision.ts`)
- KHÔNG gọi Claude API thẳng từ controller
- Sau này muốn đổi model hoặc fine-tune thì chỉ đổi 1 chỗ

**Chi phí ước tính:**
- ~$0.003–0.015/ảnh tùy độ phức tạp
- 500 ảnh/ngày ≈ $45–150/tháng (giai đoạn MVP)
- Cache kết quả món phổ biến để giảm chi phí

### 4.5. Infrastructure
```
MVP (< 5k user):    Railway (backend + DB)
Scale (> 10k user): AWS ECS + RDS
CDN:                Cloudflare
Image storage:      Cloudflare R2 (rẻ hơn S3 70%)
CI/CD:              GitHub Actions
Monitoring:         Sentry (error tracking)
Analytics:          PostHog (self-host)
Push:               Firebase Cloud Messaging
```

### 4.6. Tích hợp bên ngoài

| Category | Services |
|---|---|
| Health & Fitness | Apple HealthKit, Google Health Connect, Garmin Connect API, Strava API, Xiaomi Health |
| Auth | Supabase Auth: Google, Apple, SĐT Việt Nam |
| SMS OTP | Twilio (cho người cao tuổi) |
| Payment | Apple IAP, Google Play Billing, VNPay, MoMo, RevenueCat (cross-platform subscription management) |
| Analytics | PostHog, Mixpanel, Sentry, OneSignal |

### 4.7. Chi phí vận hành ước tính

| Service | Giai đoạn MVP (< 5k user) | Giai đoạn scale (20k user) |
|---|---|---|
| Claude API | $45–150/tháng | $400–800/tháng |
| Railway / AWS | $20–50/tháng | $300–600/tháng |
| Cloudflare R2 | $5–15/tháng | $50–100/tháng |
| Firebase FCM | Miễn phí | Miễn phí |
| Sentry | Miễn phí (5k events) | $26/tháng |
| RevenueCat | Miễn phí (< 2.5k user) | $99/tháng |
| **Tổng** | **~$70–215/tháng** | **~$600–1.200/tháng** |

---

## 5. DATABASE SCHEMA

### 5.1. Core Tables

```sql
-- USERS: Tài khoản đăng nhập
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    auth_provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'phone'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES: Hồ sơ thành viên (1 user có nhiều profile)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('adult', 'baby', 'teen', 'senior')),
    avatar_url TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height_cm REAL,
    weight_kg REAL,
    activity_level INT DEFAULT 2, -- 1: sedentary, 2: light, 3: moderate, 4: active, 5: very active
    tdee_kcal REAL, -- Total Daily Energy Expenditure (tự tính)
    nutrition_targets JSONB, -- {"calories": 1900, "protein_g": 80, "carbs_g": 250, "fat_g": 60, ...}
    ui_preferences JSONB, -- {"font_scale": 1.0, "theme": "default", "simplified_mode": false}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAMILIES: Nhóm gia đình
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAMILY_MEMBERS: Liên kết profile với gia đình
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member', 'child')),
    privacy_settings JSONB DEFAULT '{"show_details_to_family": true, "show_meal_logs": true}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_id, profile_id)
);

-- FOODS: Database thực phẩm / món ăn Việt Nam
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_vi VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    category VARCHAR(50), -- 'main_dish', 'soup', 'side', 'drink', 'snack', 'dessert', 'baby_food', 'formula'
    region VARCHAR(20), -- 'north', 'central', 'south', 'common'
    description TEXT,
    cal_per_100g REAL NOT NULL,
    protein_per_100g REAL NOT NULL,
    carbs_per_100g REAL NOT NULL,
    fat_per_100g REAL NOT NULL,
    fiber_per_100g REAL,
    micronutrients_per_100g JSONB, -- {"calcium_mg": 20, "iron_mg": 1.5, "vitamin_d_iu": 0, ...}
    typical_portion_g REAL, -- Khẩu phần phổ biến (1 tô, 1 đĩa...)
    image_url TEXT,
    verified BOOLEAN DEFAULT FALSE, -- Đã được chuyên gia kiểm duyệt
    embedding VECTOR(1536), -- pgvector cho RAG search
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL_LOGS: Nhật ký bữa ăn
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'baby_meal', 'formula')),
    image_url TEXT,
    ai_raw_result JSONB, -- Kết quả thô từ Claude Vision
    ai_confidence REAL, -- 0.0 - 1.0
    user_confirmed BOOLEAN DEFAULT FALSE, -- User đã xác nhận/sửa
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL_ITEMS: Từng món trong 1 bữa ăn
CREATE TABLE meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id), -- NULL nếu AI nhận diện nhưng chưa có trong DB
    food_name_override VARCHAR(200), -- Tên món khi chưa có trong DB
    portion_grams REAL NOT NULL,
    calories REAL NOT NULL,
    protein_g REAL NOT NULL,
    carbs_g REAL NOT NULL,
    fat_g REAL NOT NULL,
    micronutrients JSONB,
    ai_detected BOOLEAN DEFAULT TRUE, -- AI nhận ra hay user nhập tay
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY_SUMMARIES: Tổng hợp dinh dưỡng theo ngày (TimescaleDB hypertable)
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    summary_date DATE NOT NULL,
    total_calories REAL DEFAULT 0,
    total_protein_g REAL DEFAULT 0,
    total_carbs_g REAL DEFAULT 0,
    total_fat_g REAL DEFAULT 0,
    total_fiber_g REAL DEFAULT 0,
    calories_burned REAL DEFAULT 0, -- Từ wearable/activity
    net_calories REAL DEFAULT 0, -- total_calories - calories_burned
    micronutrient_totals JSONB DEFAULT '{}',
    meal_count INT DEFAULT 0,
    alerts JSONB DEFAULT '[]', -- [{"type": "low_protein", "message": "..."}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, summary_date)
);

-- HEALTH_CONDITIONS: Bệnh lý & chế độ ăn đặc biệt
CREATE TABLE health_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    condition VARCHAR(50) NOT NULL, -- 'diabetes_type2', 'hypertension', 'gout', 'heart_disease', 'kidney', 'allergy'
    severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
    dietary_restrictions JSONB, -- {"max_sugar_g": 25, "max_sodium_mg": 1500, ...}
    food_warnings JSONB, -- ["high_purine_foods", "high_sodium_foods", ...]
    medications JSONB, -- Thuốc đang uống (để tính tương tác)
    notes TEXT,
    diagnosed_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY_LOGS: Nhật ký hoạt động thể dục
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    source VARCHAR(30) NOT NULL, -- 'apple_health', 'google_fit', 'garmin', 'strava', 'manual'
    activity_type VARCHAR(50) NOT NULL, -- 'running', 'cycling', 'gym', 'swimming', 'football', 'badminton', 'yoga', 'walking'
    duration_minutes INT,
    calories_burned REAL,
    distance_km REAL,
    avg_heart_rate INT,
    steps INT,
    raw_data JSONB, -- Dữ liệu thô từ wearable
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI_CACHE: Cache kết quả AI cho món phổ biến (giảm chi phí API)
CREATE TABLE ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_hash VARCHAR(64) NOT NULL, -- SHA-256 của ảnh (hoặc perceptual hash)
    ai_result JSONB NOT NULL,
    hit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX idx_ai_cache_hash ON ai_cache(image_hash);

-- INDEXES
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_meal_logs_profile_date ON meal_logs(profile_id, logged_at);
CREATE INDEX idx_meal_items_meal ON meal_items(meal_log_id);
CREATE INDEX idx_daily_summaries_profile_date ON daily_summaries(profile_id, summary_date);
CREATE INDEX idx_activity_logs_profile_date ON activity_logs(profile_id, started_at);
CREATE INDEX idx_foods_name_vi ON foods USING gin(to_tsvector('simple', name_vi));
CREATE INDEX idx_foods_embedding ON foods USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_health_conditions_profile ON health_conditions(profile_id);
```

### 5.2. Quan hệ chính
```
USER ──1:N──> PROFILES (1 user nhiều hồ sơ: bản thân, con, bố mẹ)
USER ──1:N──> FAMILIES (1 user tạo nhiều nhóm gia đình)
FAMILY ──N:M──> PROFILES (qua FAMILY_MEMBERS, 1 profile có thể thuộc nhiều gia đình)
PROFILE ──1:N──> MEAL_LOGS ──1:N──> MEAL_ITEMS ──N:1──> FOODS
PROFILE ──1:N──> DAILY_SUMMARIES
PROFILE ──1:N──> HEALTH_CONDITIONS
PROFILE ──1:N──> ACTIVITY_LOGS
```

---

## 6. KIẾN TRÚC HỆ THỐNG

### 6.1. Luồng chụp ảnh → kết quả (core flow)

```
[User chụp ảnh]
    ↓
[Client] Resize + compress (max 1024px, <500KB)
    ↓
[API] Upload ảnh lên Cloudflare R2 → nhận URL
    ↓
[API] Check AI cache (image hash) → nếu cache hit → trả kết quả ngay
    ↓ (cache miss)
[BullMQ Job] Gọi Claude Sonnet Vision API
    Prompt: "Nhận diện tất cả món ăn trong ảnh này.
             Với mỗi món: tên tiếng Việt, ước tính khẩu phần (gram),
             confidence score. Trả về JSON."
    ↓
[API] Nhận JSON dishes[] từ Claude
    ↓
[RAG Pipeline] Với mỗi dish:
    → Vector search trong FOODS table (pgvector)
    → Match với food entry chính xác nhất
    → Lấy dữ liệu dinh dưỡng (kcal, macro, micro per 100g)
    → Tính theo khẩu phần ước tính
    ↓
[API] Check HEALTH_CONDITIONS của profile
    → Nếu có bệnh lý → kiểm tra food_warnings
    → Generate alerts nếu cần (vd: "Món này nhiều đường, cẩn thận với tiểu đường")
    ↓
[API] Trả kết quả về client:
    {
      dishes: [
        { name: "Phở bò tái", portion_g: 450, calories: 520,
          protein: 28, carbs: 55, fat: 18, confidence: 0.89 },
        ...
      ],
      alerts: ["Bữa này nhiều carb, thiếu rau xanh"],
      total: { calories: 520, protein: 28, carbs: 55, fat: 18 }
    }
    ↓
[Client] Hiển thị kết quả → User xác nhận/sửa → Lưu meal_log
    ↓
[API] Cập nhật DAILY_SUMMARIES
    ↓
[WebSocket] Sync realtime đến các device khác của user
```

### 6.2. Cấu trúc monorepo

```
genki/
├── apps/
│   └── mobile/                     # Expo Universal (iOS + Android + Web từ 1 codebase)
│       ├── app/                    # Expo Router screens (dùng chung 3 platforms)
│       │   ├── (auth)/             # Login, register, onboarding
│       │   ├── (tabs)/             # Tab (mobile) / Sidebar (web)
│       │   │   ├── home.tsx        # Dashboard chính (timeline bữa ăn)
│       │   │   ├── camera.tsx      # Chụp ảnh / chọn ảnh
│       │   │   ├── stats.tsx       # Báo cáo & thống kê
│       │   │   ├── family.tsx      # Dashboard gia đình
│       │   │   └── profile.tsx     # Cài đặt profile
│       │   ├── meal/[id].tsx       # Chi tiết bữa ăn
│       │   └── food-search.tsx     # Tìm kiếm + nhập tay
│       ├── components/
│       │   ├── meal/               # MealCard, MealTimeline, NutrientBar
│       │   ├── camera/             # CameraView, ImagePicker, AIResultView
│       │   ├── family/             # FamilyDashboard, MemberCard, InviteFlow
│       │   ├── charts/             # CalorieRing, MacroBar, GrowthChart
│       │   ├── platform/           # Platform-specific: WebLayout, MobileLayout
│       │   └── common/             # Button, Input, Card (adaptive)
│       ├── hooks/
│       │   ├── useProfile.ts       # Active profile context
│       │   ├── useFamily.ts
│       │   ├── usePlatform.ts      # Platform detection (web/ios/android)
│       │   ├── useHealthKit.ts     # Apple HealthKit (mobile only)
│       │   └── useGoogleFit.ts     # Google Health Connect (mobile only)
│       ├── lib/
│       │   ├── trpc.ts             # tRPC client setup
│       │   ├── storage.ts          # SecureStore (mobile) / cookie (web)
│       │   └── theme.ts            # Adaptive theme engine
│       └── app.json                # Expo config (platforms: ios, android, web)
│
├── packages/
│   ├── api/                        # Fastify + tRPC server
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── auth.ts         # Login, register, token refresh
│   │   │   │   ├── profile.ts      # CRUD profiles, TDEE calculation
│   │   │   │   ├── family.ts       # Family CRUD, invite, privacy
│   │   │   │   ├── meal.ts         # Meal log CRUD, daily summary
│   │   │   │   ├── food.ts         # Food search, browse, suggest
│   │   │   │   ├── ai.ts           # AI scan endpoint
│   │   │   │   ├── activity.ts     # Activity logs, wearable sync
│   │   │   │   ├── health.ts       # Health conditions, alerts
│   │   │   │   └── subscription.ts # Payment, plan management
│   │   │   ├── services/
│   │   │   │   ├── nutrition.ts    # TDEE calc, macro targets, alerts
│   │   │   │   ├── daily-summary.ts
│   │   │   │   └── who-standards.ts # WHO growth standards cho baby
│   │   │   ├── ai/                 # *** AI ABSTRACTION LAYER ***
│   │   │   │   ├── vision.ts       # Claude Vision wrapper
│   │   │   │   ├── rag.ts          # RAG pipeline (pgvector search)
│   │   │   │   ├── chat.ts         # AI chat dinh dưỡng
│   │   │   │   ├── prompts/        # Prompt templates (versioned)
│   │   │   │   │   ├── food-recognition.ts
│   │   │   │   │   ├── multi-dish.ts
│   │   │   │   │   └── portion-estimation.ts
│   │   │   │   └── cache.ts        # AI result caching logic
│   │   │   ├── integrations/
│   │   │   │   ├── apple-health.ts
│   │   │   │   ├── google-fit.ts
│   │   │   │   ├── garmin.ts
│   │   │   │   └── strava.ts
│   │   │   ├── jobs/               # BullMQ job processors
│   │   │   │   ├── ai-scan.ts      # Process AI scan async
│   │   │   │   ├── daily-summary.ts # Nightly summary aggregation
│   │   │   │   ├── push-notification.ts
│   │   │   │   └── export-report.ts
│   │   │   └── server.ts           # Fastify entry point
│   │   └── package.json
│   │
│   ├── db/                         # Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Schema definition
│   │   │   └── migrations/         # Migration history
│   │   ├── seed/
│   │   │   ├── foods.ts            # Seed 2000 món Việt
│   │   │   └── who-standards.ts    # WHO growth data
│   │   └── package.json
│   │
│   ├── shared/                     # Code dùng chung FE + BE
│   │   ├── types/                  # TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── profile.ts
│   │   │   ├── meal.ts
│   │   │   ├── food.ts
│   │   │   └── family.ts
│   │   ├── constants/
│   │   │   ├── nutrition.ts        # RDA values theo tuổi/giới tính
│   │   │   ├── activities.ts       # MET values cho các hoạt động
│   │   │   └── health-conditions.ts
│   │   ├── validators/             # Zod schemas (dùng chung FE + BE)
│   │   │   ├── profile.ts
│   │   │   ├── meal.ts
│   │   │   └── family.ts
│   │   └── utils/
│   │       ├── tdee.ts             # Tính TDEE (Mifflin-St Jeor)
│   │       ├── bmi.ts              # BMI theo chuẩn Á
│   │       └── who-growth.ts       # Z-score growth charts
│   │
│   └── ui/                         # Design system
│       ├── themes/
│       │   ├── base.ts             # Base tokens
│       │   ├── adult.ts            # Default theme
│       │   ├── senior.ts           # Font lớn, contrast cao, simplified
│       │   ├── teen.ts             # Trẻ trung, gamification
│       │   └── baby.ts             # Pastel, friendly
│       ├── components/             # Shared UI primitives
│       └── package.json
│
├── turbo.json                      # Turborepo config
├── package.json                    # Root workspace
├── docker-compose.yml              # Local dev: Postgres + Redis
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, typecheck, test
│       └── deploy.yml              # Deploy to Railway/AWS
└── README.md
```

### 6.3. Key API Endpoints (tRPC routers)

```typescript
// auth router
auth.register          // POST: Đăng ký (Google/Apple/SĐT)
auth.login             // POST: Đăng nhập
auth.refreshToken      // POST: Refresh JWT

// profile router
profile.create         // POST: Tạo hồ sơ mới (adult/baby/teen/senior)
profile.update         // PUT: Cập nhật thông tin
profile.getActive      // GET: Lấy profile đang active
profile.switchProfile  // POST: Chuyển profile
profile.calculateTDEE  // POST: Tính lại TDEE

// family router
family.create          // POST: Tạo gia đình
family.invite          // POST: Tạo invite code
family.join            // POST: Tham gia gia đình bằng code
family.getDashboard    // GET: Tổng quan gia đình
family.updatePrivacy   // PUT: Cập nhật quyền riêng tư

// meal router
meal.scan              // POST: Chụp ảnh → AI nhận diện (async via BullMQ)
meal.getScanResult     // GET: Lấy kết quả scan (polling hoặc WebSocket)
meal.confirmLog        // POST: Xác nhận + lưu bữa ăn
meal.updateLog         // PUT: Sửa bữa ăn
meal.deleteLog         // DELETE: Xóa bữa ăn
meal.getDailyLogs      // GET: Nhật ký theo ngày
meal.getDailySummary   // GET: Tổng hợp dinh dưỡng ngày

// food router
food.search            // GET: Tìm kiếm món ăn (text search + vector)
food.getById           // GET: Chi tiết 1 món
food.suggest           // GET: Gợi ý món phổ biến
food.submitFeedback    // POST: User báo sai thông tin

// activity router
activity.syncHealth    // POST: Sync từ Apple Health / Google Fit
activity.logManual     // POST: Nhập hoạt động tay
activity.getDailyBurn  // GET: Tổng calories burned hôm nay

// health router
health.addCondition    // POST: Thêm bệnh lý
health.getAlerts       // GET: Cảnh báo thực phẩm kiêng kỵ
health.getFoodWarnings // GET: Check 1 món ăn có phù hợp không

// subscription router
subscription.getPlans  // GET: Danh sách gói
subscription.purchase  // POST: Mua gói (RevenueCat)
subscription.getStatus // GET: Trạng thái subscription hiện tại
```

---

## 7. LỘ TRÌNH PHÁT TRIỂN CHI TIẾT

### Phase 0 — Foundation (Tuần 1–4)

#### Sprint 0 (Tuần 1–2): Setup & Architecture
- [ ] Wireframe toàn bộ user flow (Figma)
- [ ] Monorepo setup (Turborepo + packages)
- [ ] DB schema: users, profiles, families (Prisma)
- [ ] Railway + GitHub Actions CI/CD
- [ ] Auth: Google/Apple/SĐT (Supabase Auth)
- [ ] Expo project init + navigation shell
- [ ] Chuẩn bị DB 200 món ăn phổ biến nhất VN
- [ ] Mã hóa at-rest + TLS setup
- **Deliverable**: Repo chạy được, auth flow hoàn chỉnh, DB schema reviewed

#### Sprint 1 (Tuần 3–4): Design System & Profile Engine
- [ ] Design system: typography, color, spacing cho 4 nhóm tuổi
- [ ] Profile switcher component
- [ ] Adaptive layout engine (font size, padding theo profile type)
- [ ] Family invite flow API
- [ ] Profile CRUD + quyền riêng tư
- [ ] Nutrition reference data: RDA theo tuổi/giới tính
- **Deliverable**: Luồng gia đình end-to-end demo được
- **🚩 Milestone 1**: App chạy, auth xong, multi-profile hoạt động

### Phase 1 — Core AI + Nhật ký (Tuần 5–12)

#### Sprint 2 (Tuần 5–6): AI Vision MVP
- [ ] Claude Sonnet Vision API integration
- [ ] Prompt engineering cho món Việt
- [ ] RAG pipeline: pgvector search trong FOODS
- [ ] Image upload → R2 → AI process → JSON
- [ ] Camera UI + ảnh preview + loading
- [ ] Kết quả nhận diện: danh sách món + chỉnh sửa tay
- **Deliverable**: Chụp ảnh tô phở → AI nhận ra trong <5 giây

#### Sprint 3 (Tuần 7–8): Nhật ký ăn uống
- [ ] Màn hình chính: timeline bữa ăn trong ngày
- [ ] Calorie ring + macro bars (protein/carb/fat)
- [ ] Meal log API: CRUD, liên kết profile
- [ ] TDEE calculation theo profile
- [ ] Tìm kiếm + nhập tay món ăn
- [ ] Mở rộng DB lên 500 món
- **Deliverable**: 1 ngày ăn uống đầy đủ với tổng calo + macro

#### Sprint 4 (Tuần 9–10): AI nâng cao + Mâm cơm
- [ ] Multi-dish detection (nhiều món trong 1 ảnh)
- [ ] Portion estimation thông minh
- [ ] Confidence scoring + fallback (AI ko chắc → hỏi user)
- [ ] UI: tick/bỏ tick món trong mâm, sửa khẩu phần
- [ ] Cache kết quả AI cho món phổ biến
- [ ] Feedback loop: user sửa → cải thiện prompt
- **Deliverable**: Chụp mâm cơm gia đình → tách ra 4 món

#### Sprint 5 (Tuần 11–12): Web Polish + Đồng bộ
- [ ] Web responsive layout tối ưu cho desktop (Expo Web đã chạy từ Sprint 0)
- [ ] PWA manifest + offline basic
- [ ] WebSocket realtime sync giữa devices
- [ ] Web-specific: sidebar thay tab bar, dashboard rộng hơn
- [ ] Cloudflare CDN deploy cho web
- **Deliverable**: Web app tại app.genki.vn đã polish, trải nghiệm desktop tốt
- **🚩 Milestone 2 — Closed Beta**: 200–500 user thật, thu thập feedback 2 tuần

### Phase 2 — Gia đình + Monetization (Tuần 13–22)

#### Sprint 6 (Tuần 13–14): Hồ sơ em bé
- [ ] Baby profile UI: nhật ký sữa mẹ/công thức, ăn dặm
- [ ] Chuẩn WHO: chiều cao/cân nặng theo tháng tuổi
- [ ] Biểu đồ tăng trưởng so với WHO
- [ ] DB thực phẩm ăn dặm + sữa công thức VN

#### Sprint 7 (Tuần 15–16): Hồ sơ người cao tuổi
- [ ] Senior UI: font 18-22px, nút 56px, contrast cao
- [ ] Simplified flow: chụp ảnh → xác nhận → xong
- [ ] Bệnh lý tag + cảnh báo thực phẩm kiêng kỵ
- [ ] Nhắc uống thuốc (push notification)

#### Sprint 8 (Tuần 17–18): Dashboard gia đình
- [ ] Family dashboard: card tóm tắt từng thành viên
- [ ] Cảnh báo cross-profile ("Bé Na thiếu canxi 3 ngày")
- [ ] Aggregation API cho nutrition data
- [ ] Quyền riêng tư cho teen

#### Sprint 9 (Tuần 19–20): Wearable + Fitness sync
- [ ] Apple HealthKit integration
- [ ] Google Health Connect
- [ ] Calories burned → TDEE realtime
- [ ] Activity feed: workout history

#### Sprint 10 (Tuần 21–22): Subscription + Payment
- [ ] RevenueCat integration
- [ ] Paywall UI
- [ ] Apple IAP + Google Play Billing
- [ ] VNPay/MoMo cho web
- [ ] Onboarding flow cho conversion
- **🚩 Milestone 3 — Public Launch**: App Store + Google Play + web

### Phase 3 — Growth & Scale (Tuần 23–40)
- Sprint 11–12: AI chatbot + gợi ý thực đơn
- Sprint 13–14: Teen profile + gamification
- Sprint 15–16: Garmin/Strava + báo cáo nâng cao
- Sprint 17–18: Dinh dưỡng bệnh lý + B2B
- **🚩 Milestone 4 — Product-Market Fit**: 50k users, 3k trả phí, MRR 200M VND

---

## 8. TEAM & NGÂN SÁCH

### 8.1. Team tối thiểu (4+1 người)

| Vai trò | Mô tả | Lương/tháng |
|---|---|---|
| PM + Senior Fullstack (Lead) | Kiến trúc, code review, AI integration, DB design, sprint planning | Co-founder equity |
| Mobile Developer | React Native UI, HealthKit/Google Fit, adaptive layout | 15–22M VND |
| Backend Developer | tRPC API, auth, payment, wearable sync, BullMQ | 15–22M VND |
| Data + AI Engineer | DB 2000 món Việt, prompt engineering, RAG pipeline | 18–25M VND |
| UI/UX Designer | Design system 4 persona, wireframe, user testing | 8–15M VND (freelance) |

### 8.2. Ngân sách 10 tháng

| Hạng mục | Ước tính |
|---|---|
| Lương team | 600–800M VND |
| Infra + API | 30–60M VND |
| Apple Dev + Google Play | ~5M VND |
| Marketing (launch) | 50–100M VND |
| **Tổng** | **~700M–1 tỷ VND** |

---

## 9. KPI THEO GIAI ĐOẠN

| Metric | Closed Beta (tuần 12) | Public Launch (tuần 22) | PMF (tuần 40) |
|---|---|---|---|
| Downloads | 500 | 5.000 | 50.000 |
| DAU | 100 | 500 | 5.000 |
| Paying users | — | 100 (2%) | 3.000 (6%) |
| AI accuracy | ≥ 75% | ≥ 82% | ≥ 88% |
| D7 retention | ≥ 30% | — | — |
| D30 retention | — | ≥ 20% | ≥ 25% |
| MRR | — | 8M VND | 200M VND |
| Crash rate | < 1% | < 0.5% | < 0.3% |
| NPS | ≥ 40 | ≥ 45 | ≥ 50 |

---

## 10. QUYẾT ĐỊNH KỸ THUẬT KHÔNG THỂ LÀM LẠI

> ⚠️ Ba quyết định phải đúng từ ngày 1 — sai thì refactor cực kỳ tốn kém:

1. **Multi-profile schema**: Thiết kế DB cho phép nhiều hồ sơ (baby, teen, adult, senior) trong 1 account từ sprint 0. Bảng `profiles` tách biệt khỏi `users` là bắt buộc.

2. **Mã hóa dữ liệu sức khỏe**: Encrypt dữ liệu nhạy cảm at-rest và in-transit ngay từ đầu. Luật bảo vệ dữ liệu cá nhân Việt Nam 2023 yêu cầu tuân thủ.

3. **AI abstraction layer**: Gọi AI qua `packages/api/ai/` — KHÔNG gọi Claude API thẳng từ controller. Sau này đổi model hoặc fine-tune thì chỉ đổi 1 chỗ.

---

## 11. GHI CHÚ CHO DEV

### Conventions
- Ngôn ngữ code: English (tên biến, comments)
- Ngôn ngữ UI: Tiếng Việt (default), English (future)
- Git: Conventional Commits (`feat:`, `fix:`, `chore:`)
- Branch: `main` → `develop` → `feature/xxx`
- PR: Require 1 review trước khi merge
- Test: Vitest cho unit test, Playwright cho E2E (tối thiểu cho critical flows)

### Nguyên tắc phát triển
- Ship sớm, ship thường xuyên — 2 tuần 1 sprint
- Phase 0+1 chỉ build cho persona "người lớn" — kiến trúc multi-profile sẵn nhưng UI chỉ 1 theme
- Mọi feature phải có feature flag (dùng PostHog)
- Performance budget: app launch < 3s, AI scan < 5s, page load < 2s
- Accessibility: hỗ trợ Dynamic Type (iOS) và font scaling (Android)

---

*Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho toàn bộ dự án. Mọi thay đổi phải được PM approve và cập nhật tại đây.*
