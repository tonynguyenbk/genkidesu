# GENKI — Sprint 0 Spec: Setup & Architecture

> **Sprint**: 0 · **Thời gian**: Tuần 1–2 (10 ngày làm việc)
> **Mục tiêu**: Nền móng kỹ thuật đúng từ đầu — monorepo, auth, multi-profile, family system
> **Team**: Lead (PM/Fullstack) · Mobile Dev · Backend Dev · Data/AI Engineer

---

## MỤC TIÊU SPRINT

Cuối Sprint 0, chúng ta phải có:
1. Monorepo chạy được trên iOS simulator + Android emulator + web browser
2. Auth flow hoàn chỉnh (Google / Apple / SĐT)
3. Multi-profile system (tạo profile adult/baby/teen/senior)
4. Family system (tạo gia đình, mời thành viên, chuyển profile)
5. CI/CD pipeline deploy được lên Railway
6. Database schema đã migrate và seed data cơ bản

**KHÔNG làm trong Sprint 0**: AI Vision, camera, nhật ký bữa ăn, wearable sync, payment.

---

## TASK BREAKDOWN

### NGÀY 1–2: Project Setup

#### Task 0.1 — Monorepo Init
**Owner**: Lead
**Thời gian**: 4h

```bash
# 1. Tạo monorepo với Turborepo
npx create-turbo@latest genki --package-manager pnpm

# 2. Cấu trúc workspace
genki/
├── apps/
│   └── mobile/          # Expo universal (iOS + Android + Web từ 1 codebase)
├── packages/
│   ├── api/             # Fastify + tRPC server
│   ├── db/              # Prisma schema + migrations
│   ├── shared/          # Types, validators, utils
│   └── ui/              # Design system (shared components)
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml

# 3. Docker compose cho local dev
# docker-compose.yml
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: genki
      POSTGRES_USER: genki
      POSTGRES_PASSWORD: genki_dev_2026
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

**Acceptance criteria**:
- `pnpm install` chạy không lỗi
- `pnpm dev` start được cả mobile + web + api đồng thời
- `docker compose up -d` chạy Postgres + Redis local
- TypeScript strict mode bật ở tất cả packages

---

#### Task 0.2 — Expo Universal App Init (iOS + Android + Web)
**Owner**: Mobile Dev
**Thời gian**: 5h

```bash
cd apps/mobile
npx create-expo-app@latest . --template tabs
npx expo install expo-router expo-secure-store expo-image-picker expo-camera
npx expo install react-native-web react-dom @expo/metro-runtime
```

**Bật Expo Web** trong `app.json`:
```json
{
  "expo": {
    "name": "Genki",
    "slug": "genki",
    "platforms": ["ios", "android", "web"],
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    }
  }
}
```

**Chạy trên 3 platforms:**
```bash
npx expo start          # Dev server
# Nhấn 'i' → iOS simulator
# Nhấn 'a' → Android emulator
# Nhấn 'w' → Web browser (localhost:8081)
```

**Cấu trúc Expo Router (dùng chung cho cả mobile + web):**
```
apps/mobile/app/
├── _layout.tsx              # Root layout (auth check, theme provider)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx            # Màn hình đăng nhập
│   ├── register.tsx         # Đăng ký + onboarding
│   └── phone-otp.tsx        # Xác thực SĐT
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation (mobile) / sidebar (web)
│   ├── index.tsx            # Home — dashboard chính (placeholder Sprint 0)
│   ├── camera.tsx           # Chụp ảnh (placeholder Sprint 0)
│   ├── stats.tsx            # Thống kê (placeholder Sprint 0)
│   ├── family.tsx           # Dashboard gia đình
│   └── profile.tsx          # Cài đặt profile
├── profile/
│   ├── create.tsx           # Tạo profile mới
│   ├── [id].tsx             # Chi tiết profile
│   └── switch.tsx           # Chuyển profile
└── family/
    ├── create.tsx           # Tạo gia đình
    ├── invite.tsx           # Mời thành viên
    └── join.tsx             # Tham gia bằng invite code
```

**Xử lý khác biệt mobile vs web:**
```typescript
// packages/shared/utils/platform.ts
import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";
export const isMobile = Platform.OS === "ios" || Platform.OS === "android";

// Sử dụng trong component:
// - Tab bar (mobile) vs Sidebar (web)
// - Native camera (mobile) vs File upload + webcam (web)
// - SecureStore (mobile) vs httpOnly cookie (web)
```

**Acceptance criteria**:
- App chạy trên iOS simulator, Android emulator, VÀ web browser từ cùng 1 codebase
- Tab navigation hoạt động trên mobile, responsive layout trên web
- Placeholder screens cho tất cả routes
- Expo Router deep linking hoạt động trên cả 3 platforms
- `Platform.OS` detect đúng platform

---

#### Task 0.3 — Backend API Init
**Owner**: Backend Dev
**Thời gian**: 4h

```bash
cd packages/api
pnpm add fastify @trpc/server @trpc/client zod
pnpm add @fastify/cors @fastify/websocket
pnpm add bullmq ioredis
pnpm add -D tsx @types/node
```

**File cốt lõi:**

```typescript
// packages/api/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./routers";
import { createContext } from "./context";

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext },
});

server.listen({ port: 4000, host: "0.0.0.0" });
```

```typescript
// packages/api/src/routers/index.ts
import { router } from "../trpc";
import { authRouter } from "./auth";
import { profileRouter } from "./profile";
import { familyRouter } from "./family";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  family: familyRouter,
});

export type AppRouter = typeof appRouter;
```

**Acceptance criteria**:
- `pnpm dev` trong api/ start server ở port 4000
- GET /trpc/health trả { status: "ok" }
- tRPC playground accessible ở dev mode

---

### NGÀY 2–3: Database Schema

#### Task 0.5 — Prisma Schema + Migration
**Owner**: Lead + Backend Dev
**Thời gian**: 6h

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector"), pgcrypto]
}

// ==========================================
// AUTH & USERS
// ==========================================

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String?   @unique @db.VarChar(255)
  phone         String?   @unique @db.VarChar(20)
  passwordHash  String?   @map("password_hash") @db.VarChar(255)
  authProvider  String    @map("auth_provider") @db.VarChar(50) // google, apple, phone
  avatarUrl     String?   @map("avatar_url") @db.Text
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz()
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  profiles      Profile[]
  ownedFamilies Family[]  @relation("FamilyOwner")
  sessions      Session[]

  @@map("users")
}

model Session {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  token        String   @unique @db.VarChar(500)
  refreshToken String   @unique @map("refresh_token") @db.VarChar(500)
  deviceInfo   Json?    @map("device_info") // { platform, os, appVersion }
  expiresAt    DateTime @map("expires_at") @db.Timestamptz()
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// ==========================================
// PROFILES (multi-profile system)
// ==========================================

enum ProfileType {
  adult
  baby
  teen
  senior
}

enum Gender {
  male
  female
  other
}

model Profile {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String      @map("user_id") @db.Uuid
  name             String      @db.VarChar(100)
  type             ProfileType
  avatarUrl        String?     @map("avatar_url") @db.Text
  birthDate        DateTime?   @map("birth_date") @db.Date
  gender           Gender?
  heightCm         Float?      @map("height_cm")
  weightKg         Float?      @map("weight_kg")
  activityLevel    Int         @default(2) @map("activity_level") // 1-5
  tdeeKcal         Float?      @map("tdee_kcal")
  nutritionTargets Json?       @map("nutrition_targets")
  // { calories: 1900, protein_g: 80, carbs_g: 250, fat_g: 60 }
  uiPreferences    Json?       @map("ui_preferences")
  // { font_scale: 1.0, theme: "default", simplified_mode: false }
  isActive         Boolean     @default(true) @map("is_active")
  createdAt        DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime    @updatedAt @map("updated_at") @db.Timestamptz()

  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  familyMembers    FamilyMember[]
  healthConditions HealthCondition[]
  mealLogs         MealLog[]
  dailySummaries   DailySummary[]
  activityLogs     ActivityLog[]

  @@index([userId])
  @@index([type])
  @@map("profiles")
}

// ==========================================
// FAMILY SYSTEM
// ==========================================

model Family {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerId    String   @map("owner_id") @db.Uuid
  name       String   @db.VarChar(100)
  inviteCode String   @unique @map("invite_code") @db.VarChar(8)
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  owner   User           @relation("FamilyOwner", fields: [ownerId], references: [id])
  members FamilyMember[]

  @@index([ownerId])
  @@index([inviteCode])
  @@map("families")
}

enum FamilyRole {
  owner
  member
  child // profile dưới 13 tuổi, không có quyền tự chỉnh privacy
}

model FamilyMember {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  familyId        String     @map("family_id") @db.Uuid
  profileId       String     @map("profile_id") @db.Uuid
  role            FamilyRole
  privacySettings Json       @default("{\"show_details_to_family\": true, \"show_meal_logs\": true}") @map("privacy_settings")
  joinedAt        DateTime   @default(now()) @map("joined_at") @db.Timestamptz()

  family  Family  @relation(fields: [familyId], references: [id], onDelete: Cascade)
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([familyId, profileId])
  @@index([familyId])
  @@index([profileId])
  @@map("family_members")
}

// ==========================================
// HEALTH CONDITIONS
// ==========================================

model HealthCondition {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  profileId           String   @map("profile_id") @db.Uuid
  condition           String   @db.VarChar(50) // diabetes_type2, hypertension, gout, etc.
  severity            String?  @db.VarChar(20) // mild, moderate, severe
  dietaryRestrictions Json?    @map("dietary_restrictions")
  foodWarnings        Json?    @map("food_warnings")
  notes               String?  @db.Text
  diagnosedAt         DateTime? @map("diagnosed_at") @db.Date
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz()

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId])
  @@map("health_conditions")
}

// ==========================================
// FOODS DATABASE (seed riêng — Task của Data Engineer)
// ==========================================

model Food {
  id                    String                  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nameVi                String                  @map("name_vi") @db.VarChar(200)
  nameEn                String?                 @map("name_en") @db.VarChar(200)
  category              String?                 @db.VarChar(50)
  region                String?                 @db.VarChar(20) // north, central, south, common
  description           String?                 @db.Text
  calPer100g            Float                   @map("cal_per_100g")
  proteinPer100g        Float                   @map("protein_per_100g")
  carbsPer100g          Float                   @map("carbs_per_100g")
  fatPer100g            Float                   @map("fat_per_100g")
  fiberPer100g          Float?                  @map("fiber_per_100g")
  micronutrientsPer100g Json?                   @map("micronutrients_per_100g")
  typicalPortionG       Float?                  @map("typical_portion_g")
  imageUrl              String?                 @map("image_url") @db.Text
  verified              Boolean                 @default(false)
  embedding             Unsupported("vector(1536)")?
  createdAt             DateTime                @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime                @updatedAt @map("updated_at") @db.Timestamptz()

  mealItems MealItem[]

  @@map("foods")
}

// ==========================================
// MEAL LOGS (cấu trúc sẵn — build ở Sprint 2-3)
// ==========================================

model MealLog {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  profileId     String    @map("profile_id") @db.Uuid
  mealType      String    @map("meal_type") @db.VarChar(20)
  imageUrl      String?   @map("image_url") @db.Text
  aiRawResult   Json?     @map("ai_raw_result")
  aiConfidence  Float?    @map("ai_confidence")
  userConfirmed Boolean   @default(false) @map("user_confirmed")
  notes         String?   @db.Text
  loggedAt      DateTime  @map("logged_at") @db.Timestamptz()
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  profile  Profile    @relation(fields: [profileId], references: [id], onDelete: Cascade)
  items    MealItem[]

  @@index([profileId, loggedAt])
  @@map("meal_logs")
}

model MealItem {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  mealLogId        String   @map("meal_log_id") @db.Uuid
  foodId           String?  @map("food_id") @db.Uuid
  foodNameOverride String?  @map("food_name_override") @db.VarChar(200)
  portionGrams     Float    @map("portion_grams")
  calories         Float
  proteinG         Float    @map("protein_g")
  carbsG           Float    @map("carbs_g")
  fatG             Float    @map("fat_g")
  micronutrients   Json?
  aiDetected       Boolean  @default(true) @map("ai_detected")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz()

  mealLog MealLog @relation(fields: [mealLogId], references: [id], onDelete: Cascade)
  food    Food?   @relation(fields: [foodId], references: [id])

  @@index([mealLogId])
  @@map("meal_items")
}

model DailySummary {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  profileId           String   @map("profile_id") @db.Uuid
  summaryDate         DateTime @map("summary_date") @db.Date
  totalCalories       Float    @default(0) @map("total_calories")
  totalProteinG       Float    @default(0) @map("total_protein_g")
  totalCarbsG         Float    @default(0) @map("total_carbs_g")
  totalFatG           Float    @default(0) @map("total_fat_g")
  totalFiberG         Float    @default(0) @map("total_fiber_g")
  caloriesBurned      Float    @default(0) @map("calories_burned")
  netCalories         Float    @default(0) @map("net_calories")
  micronutrientTotals Json     @default("{}") @map("micronutrient_totals")
  mealCount           Int      @default(0) @map("meal_count")
  alerts              Json     @default("[]")
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, summaryDate])
  @@index([profileId, summaryDate])
  @@map("daily_summaries")
}

model ActivityLog {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  profileId      String    @map("profile_id") @db.Uuid
  source         String    @db.VarChar(30)
  activityType   String    @map("activity_type") @db.VarChar(50)
  durationMin    Int?      @map("duration_min")
  caloriesBurned Float?    @map("calories_burned")
  distanceKm     Float?    @map("distance_km")
  avgHeartRate   Int?      @map("avg_heart_rate")
  steps          Int?
  rawData        Json?     @map("raw_data")
  startedAt      DateTime  @map("started_at") @db.Timestamptz()
  endedAt        DateTime? @map("ended_at") @db.Timestamptz()
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, startedAt])
  @@map("activity_logs")
}
```

**Commands:**
```bash
cd packages/db
pnpm prisma migrate dev --name init
pnpm prisma generate
```

**Acceptance criteria**:
- Migration chạy thành công
- `pnpm prisma studio` mở được, thấy tất cả tables
- pgvector extension enabled
- Tất cả indexes đã tạo

---

### NGÀY 3–4: Authentication

#### Task 0.6 — Auth Backend (JWT-based)
**Owner**: Backend Dev
**Thời gian**: 8h

**Flow đăng nhập:**
```
[Client] → POST /trpc/auth.loginWithGoogle { idToken }
    → [API] Verify Google ID token
    → [API] Upsert user (tạo mới nếu chưa có)
    → [API] Tạo profile "adult" mặc định nếu user mới
    → [API] Generate JWT access token (15 min) + refresh token (30 days)
    → [API] Lưu session vào DB
    → [Client] Lưu tokens vào SecureStore (mobile) / httpOnly cookie (web)

[Client] → POST /trpc/auth.loginWithPhone { phone }
    → [API] Generate 6-digit OTP
    → [API] Gửi SMS qua Twilio (hoặc dev mode: log ra console)
    → [Client] Nhập OTP

[Client] → POST /trpc/auth.verifyOTP { phone, otp }
    → [API] Verify OTP
    → [API] Upsert user + session
    → [Client] Nhận tokens

[Client] → POST /trpc/auth.refresh { refreshToken }
    → [API] Verify refresh token
    → [API] Generate new access + refresh tokens
    → [API] Invalidate old session
```

```typescript
// packages/api/src/routers/auth.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  // Google OAuth
  loginWithGoogle: publicProcedure
    .input(z.object({ idToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify Google ID token
      // 2. Upsert user
      // 3. Create default adult profile if new
      // 4. Generate tokens
      // 5. Create session
      // Return: { accessToken, refreshToken, user, profiles }
    }),

  // Apple Sign-In
  loginWithApple: publicProcedure
    .input(z.object({
      identityToken: z.string(),
      fullName: z.object({
        givenName: z.string().optional(),
        familyName: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Similar to Google flow
    }),

  // Phone OTP — Step 1: Send OTP
  sendOTP: publicProcedure
    .input(z.object({
      phone: z.string().regex(/^(\+84|0)\d{9,10}$/),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Generate 6-digit OTP
      // 2. Store OTP in Redis (TTL 5 min)
      // 3. Send SMS via Twilio (dev: log to console)
      // Return: { success: true, expiresIn: 300 }
    }),

  // Phone OTP — Step 2: Verify
  verifyOTP: publicProcedure
    .input(z.object({
      phone: z.string(),
      otp: z.string().length(6),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Check OTP in Redis
      // 2. Upsert user
      // 3. Create default profile if new
      // 4. Generate tokens
      // Return: { accessToken, refreshToken, user, profiles }
    }),

  // Refresh token
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify refresh token exists in sessions table
      // 2. Check expiry
      // 3. Generate new token pair
      // 4. Invalidate old session, create new
      // Return: { accessToken, refreshToken }
    }),

  // Logout
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      // Delete session from DB
      // Return: { success: true }
    }),

  // Get current user + profiles
  me: publicProcedure
    .query(async ({ ctx }) => {
      // Return: { user, profiles, activeProfile, families }
    }),
});
```

**Acceptance criteria**:
- Đăng nhập bằng Google OAuth hoạt động (mobile + web)
- Đăng nhập bằng SĐT + OTP hoạt động (dev mode: OTP log ra console)
- JWT access token hết hạn sau 15 phút → auto refresh
- Logout xóa session trong DB
- Protected routes trả 401 nếu không có token hợp lệ

---

#### Task 0.7 — Auth UI (Mobile)
**Owner**: Mobile Dev
**Thời gian**: 6h

**Màn hình Login:**
```
┌─────────────────────────┐
│                         │
│       [Genki Logo]      │
│    元気 — Khoẻ mỗi ngày │
│                         │
│  ┌───────────────────┐  │
│  │ 🔵 Tiếp tục với   │  │
│  │    Google         │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ ⚫ Tiếp tục với   │  │
│  │    Apple          │  │
│  └───────────────────┘  │
│                         │
│  ──── hoặc ────         │
│                         │
│  ┌───────────────────┐  │
│  │ 📱 Đăng nhập bằng │  │
│  │    Số điện thoại  │  │
│  └───────────────────┘  │
│                         │
│  Bằng việc tiếp tục,   │
│  bạn đồng ý với        │
│  Điều khoản & Chính    │
│  sách bảo mật          │
└─────────────────────────┘
```

**Màn hình OTP:**
```
┌─────────────────────────┐
│  ← Quay lại             │
│                         │
│  Nhập mã xác thực      │
│  Đã gửi đến 0912***789 │
│                         │
│   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │
│   │ │ │ │ │ │ │ │ │ │ │ │  │
│   └─┘ └─┘ └─┘ └─┘ └─┘ └─┘  │
│                         │
│  Gửi lại mã (45s)      │
│                         │
│  ┌───────────────────┐  │
│  │    Xác nhận       │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Acceptance criteria**:
- 3 nút đăng nhập (Google, Apple, SĐT) hoạt động
- OTP input auto-focus ô tiếp theo
- Loading state khi đang xác thực
- Error handling: sai OTP, hết hạn, network error
- Sau đăng nhập → navigate đến onboarding (nếu user mới) hoặc home (nếu đã có profile)

---

### NGÀY 4–6: Profile System

#### Task 0.8 — Profile API
**Owner**: Backend Dev
**Thời gian**: 6h

```typescript
// packages/api/src/routers/profile.ts
export const profileRouter = router({
  // Tạo profile mới
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(["adult", "baby", "teen", "senior"]),
      birthDate: z.string().datetime().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      heightCm: z.number().min(30).max(250).optional(),
      weightKg: z.number().min(1).max(300).optional(),
      activityLevel: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Tạo profile
      // 2. Tính TDEE nếu đủ thông tin (adult/teen/senior)
      // 3. Set nutrition targets mặc định theo tuổi/giới tính
      // 4. Set UI preferences mặc định theo type:
      //    - senior: { font_scale: 1.4, simplified_mode: true }
      //    - teen: { font_scale: 1.0, theme: "vibrant" }
      //    - baby: { font_scale: 1.0, theme: "pastel" }
      //    - adult: { font_scale: 1.0, theme: "default" }
      // Return: profile
    }),

  // Lấy tất cả profiles của user
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // Return: profiles[]
    }),

  // Cập nhật profile
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      heightCm: z.number().optional(),
      weightKg: z.number().optional(),
      activityLevel: z.number().min(1).max(5).optional(),
      uiPreferences: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Update fields
      // 2. Recalculate TDEE nếu height/weight/activity thay đổi
      // Return: updated profile
    }),

  // Chuyển profile active
  setActive: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Lưu active profile ID vào session/context
    }),

  // Tính TDEE
  calculateTDEE: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Mifflin-St Jeor equation:
      // Male:   BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
      // Female: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
      // TDEE = BMR × activity_multiplier
      // activity_multiplier: 1=1.2, 2=1.375, 3=1.55, 4=1.725, 5=1.9
    }),
});
```

**Acceptance criteria**:
- CRUD profile đầy đủ
- TDEE tính chính xác theo Mifflin-St Jeor
- Nutrition targets tự động set theo tuổi/giới (bảng RDA Viện Dinh dưỡng)
- 1 user có thể tạo tối đa 10 profiles
- Validation đầy đủ (tuổi, chiều cao, cân nặng trong khoảng hợp lý)

---

#### Task 0.9 — Onboarding UI + Profile Creation
**Owner**: Mobile Dev
**Thời gian**: 8h

**Flow onboarding (user mới):**
```
Bước 1: Chào mừng
┌─────────────────────────┐
│  Chào mừng đến Genki!   │
│                         │
│  Hãy tạo hồ sơ đầu     │
│  tiên của bạn           │
│                         │
│  [Bắt đầu →]           │
└─────────────────────────┘

Bước 2: Thông tin cơ bản
┌─────────────────────────┐
│  Tên của bạn            │
│  ┌───────────────────┐  │
│  │ Minh                │  │
│  └───────────────────┘  │
│                         │
│  Giới tính              │
│  [Nam] [Nữ] [Khác]     │
│                         │
│  Ngày sinh              │
│  ┌───────────────────┐  │
│  │ 15/03/1990         │  │
│  └───────────────────┘  │
│                         │
│  [Tiếp tục →]          │
└─────────────────────────┘

Bước 3: Chỉ số cơ thể
┌─────────────────────────┐
│  Chiều cao (cm)         │
│  ┌───────────────────┐  │
│  │ 170                │  │
│  └───────────────────┘  │
│                         │
│  Cân nặng (kg)          │
│  ┌───────────────────┐  │
│  │ 68                 │  │
│  └───────────────────┘  │
│                         │
│  Mức độ vận động        │
│  ○ Ít vận động          │
│  ● Vận động nhẹ         │
│  ○ Vận động vừa         │
│  ○ Vận động nhiều       │
│  ○ Rất nhiều            │
│                         │
│  [Hoàn tất →]          │
└─────────────────────────┘

Bước 4: Kết quả
┌─────────────────────────┐
│                         │
│  ✓ Hồ sơ đã tạo!       │
│                         │
│  TDEE của bạn:          │
│  ┌───────────────────┐  │
│  │   1,920 kcal/ngày │  │
│  └───────────────────┘  │
│                         │
│  Mục tiêu macro:        │
│  Protein: 80g           │
│  Carbs: 250g            │
│  Fat: 60g               │
│                         │
│  [Vào trang chính →]   │
│                         │
│  Tạo thêm hồ sơ cho    │
│  thành viên gia đình?   │
│  [Tạo ngay]            │
└─────────────────────────┘
```

**Acceptance criteria**:
- Onboarding 4 bước mượt, có animation chuyển bước
- Input validation realtime (highlight đỏ nếu sai)
- TDEE hiển thị ngay sau bước 3
- Nút "Bỏ qua" cho các field không bắt buộc
- Sau onboarding → vào Home screen

---

### NGÀY 6–8: Family System

#### Task 0.10 — Family API
**Owner**: Backend Dev
**Thời gian**: 6h

```typescript
// packages/api/src/routers/family.ts
export const familyRouter = router({
  // Tạo gia đình
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100), // "Gia đình Nguyễn"
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Generate invite code (8 ký tự, uppercase alphanumeric)
      // 2. Tạo family
      // 3. Thêm active profile của user làm owner
      // Return: { family, inviteCode }
    }),

  // Lấy danh sách gia đình của user
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // Return: families[] với members
    }),

  // Lấy dashboard gia đình
  getDashboard: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Return: { family, members[] with today's summary, alerts[] }
    }),

  // Tạo invite code mới
  regenerateInvite: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Chỉ owner mới được
      // Generate new 8-char code
    }),

  // Tham gia gia đình bằng code
  join: protectedProcedure
    .input(z.object({
      inviteCode: z.string().length(8),
      profileId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Tìm family theo invite code
      // 2. Check profile chưa thuộc family này
      // 3. Thêm family member (role: member)
      // Return: { family, role }
    }),

  // Thêm profile con (owner tạo profile baby/teen cho con)
  addChildProfile: protectedProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      name: z.string(),
      type: z.enum(["baby", "teen"]),
      birthDate: z.string().datetime(),
      gender: z.enum(["male", "female", "other"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Tạo profile mới (thuộc user hiện tại)
      // 2. Thêm vào family với role "child"
      // Return: { profile, familyMember }
    }),

  // Cập nhật quyền riêng tư
  updatePrivacy: protectedProcedure
    .input(z.object({
      familyMemberId: z.string().uuid(),
      privacySettings: z.object({
        showDetailsToFamily: z.boolean(),
        showMealLogs: z.boolean(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // Chỉ profile owner hoặc teen profile mới được sửa privacy của mình
    }),

  // Rời gia đình
  leave: protectedProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      profileId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Owner không thể rời (phải chuyển quyền trước)
      // Xóa family member record
    }),
});
```

**Acceptance criteria**:
- Tạo gia đình + invite code hoạt động
- Join bằng code hoạt động
- Tạo child profile (baby/teen) trong gia đình
- Privacy settings lưu và áp dụng đúng
- Owner không thể bị xóa khỏi family

---

#### Task 0.11 — Family UI (Mobile)
**Owner**: Mobile Dev
**Thời gian**: 6h

**Acceptance criteria**:
- Màn hình tạo gia đình
- Hiển thị invite code (có nút copy + share)
- Màn hình nhập invite code để join
- Danh sách thành viên với avatar + type badge
- Nút thêm hồ sơ con (baby/teen)
- Profile switcher ở header: tap avatar → dropdown list profiles

---

### NGÀY 8–9: CI/CD & Infrastructure

#### Task 0.12 — CI/CD Pipeline
**Owner**: Lead
**Thời gian**: 4h

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck    # tsc --noEmit toàn bộ packages
      - run: pnpm lint          # eslint
      - run: pnpm test          # vitest (unit tests)

  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy API to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: genki-api
```

**Acceptance criteria**:
- Push lên `develop` → chạy typecheck + lint + test
- Merge vào `main` → auto deploy API lên Railway
- Sentry DSN configured cho error tracking

---

#### Task 0.13 — Environment Variables
**Owner**: Lead
**Thời gian**: 1h

```bash
# .env.example

# Database
DATABASE_URL=postgresql://genki:genki_dev_2026@localhost:5432/genki

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=change-me-in-production-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Apple Sign-In
APPLE_CLIENT_ID=xxx
APPLE_TEAM_ID=xxx

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxx

# Cloudflare R2 (image storage)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=genki-images

# Sentry
SENTRY_DSN=xxx

# App
API_URL=http://localhost:4000
WEB_URL=http://localhost:5173
NODE_ENV=development
```

---

### NGÀY 9–10: Data Seed + Integration Test

#### Task 0.14 — Seed 200 món ăn phổ biến
**Owner**: Data/AI Engineer
**Thời gian**: 8h (chạy song song từ ngày 1)

**Nguồn dữ liệu ưu tiên:**
1. Bảng Thành phần Dinh dưỡng Thực phẩm Việt Nam (Viện Dinh dưỡng Quốc gia)
2. USDA FoodData Central (cho thực phẩm chung)
3. Nghiên cứu thực tế: cân đo khẩu phần phổ biến

**200 món cần có trong Sprint 0:**
- 30 món sáng (phở, bún, bánh mì, xôi, cháo, bánh cuốn...)
- 50 món chính (cơm tấm, bún bò, bún chả, cơm chiên, mì xào...)
- 30 món canh/soup
- 20 món rau/salad
- 20 món thịt/cá/trứng riêng lẻ
- 15 đồ uống (trà sữa, cà phê sữa, nước ép, sinh tố...)
- 15 snack/tráng miệng (bánh, chè, trái cây...)
- 10 sữa công thức + thức ăn dặm phổ biến
- 10 món ăn kiêng/healthy phổ biến

**Format seed data:**
```typescript
// packages/db/seed/foods.ts
const foods = [
  {
    nameVi: "Phở bò tái",
    nameEn: "Vietnamese beef pho (rare beef)",
    category: "main_dish",
    region: "north",
    calPer100g: 46,
    proteinPer100g: 3.5,
    carbsPer100g: 5.2,
    fatPer100g: 1.3,
    fiberPer100g: 0.3,
    typicalPortionG: 500,
    micronutrientsPer100g: {
      sodium_mg: 580,
      calcium_mg: 12,
      iron_mg: 0.8,
      vitamin_b12_mcg: 0.4,
    },
    verified: true,
  },
  // ... 199 món nữa
];
```

**Acceptance criteria**:
- 200 món ăn trong DB, mỗi món có đủ: tên Việt, tên Anh, category, region, macro 4 chất, typical portion
- Ít nhất 50 món có micronutrients
- Data verified bằng cross-reference với ít nhất 2 nguồn
- Seed script chạy idempotent (chạy lại không tạo duplicate)

---

#### Task 0.15 — Integration Test
**Owner**: Lead + All
**Thời gian**: 4h

**Test scenarios (manual + vitest):**

```typescript
// Scenario 1: New user flow
// 1. Register with Google → nhận tokens
// 2. Auto-create adult profile
// 3. Complete onboarding (name, height, weight)
// 4. TDEE calculated correctly
// 5. Create family "Gia đình Minh"
// 6. Get invite code
// 7. (Simulate) Second user joins with code
// 8. First user creates baby profile trong family
// 9. Switch between profiles
// 10. Family dashboard shows all members

// Scenario 2: Auth edge cases
// 1. Expired access token → refresh works
// 2. Expired refresh token → redirect to login
// 3. Invalid OTP → error message
// 4. Duplicate phone → login (not register)

// Scenario 3: Profile edge cases
// 1. Create 10 profiles → OK
// 2. Create 11th → error
// 3. Delete profile that's in a family → removed from family
// 4. Senior profile → uiPreferences has font_scale: 1.4
```

**Acceptance criteria**:
- Tất cả 3 scenarios pass
- API response time < 200ms cho mọi endpoint
- No TypeScript errors (strict mode)
- Sentry connected, test error reported

---

## DEFINITION OF DONE — SPRINT 0

Cuối ngày 10, checklist này phải tất cả ✓:

- [ ] Monorepo build thành công (`pnpm build`)
- [ ] Mobile app chạy trên iOS simulator + Android emulator
- [ ] Web app chạy trên browser (localhost:5173)
- [ ] API chạy trên Railway (staging)
- [ ] Đăng nhập Google hoạt động (mobile + web)
- [ ] Đăng nhập SĐT + OTP hoạt động (dev mode)
- [ ] Tạo profile (adult/baby/teen/senior) hoạt động
- [ ] Onboarding flow 4 bước hoàn chỉnh
- [ ] TDEE calculation chính xác
- [ ] Tạo gia đình + invite code hoạt động
- [ ] Join gia đình bằng code hoạt động
- [ ] Profile switcher hoạt động
- [ ] Family dashboard hiển thị tất cả thành viên
- [ ] 200 món ăn Việt trong database
- [ ] CI/CD: push → typecheck → deploy tự động
- [ ] Sentry error tracking connected
- [ ] README.md với setup instructions
- [ ] Không có TypeScript errors

---

## CHUẨN BỊ CHO SPRINT 1

Trong Sprint 0, đồng thời chuẩn bị cho Sprint 1 (Design System + Profile Engine):
- Data/AI Engineer: bắt đầu research prompt engineering cho Claude Vision với món Việt
- Mobile Dev: nghiên cứu Expo Camera API
- Lead: thiết kế adaptive theme system cho 4 profile types
- UI Designer (freelance): bàn giao Figma design system + wireframe cho Sprint 1-2

---

*Document version: 1.0 · Sprint 0 · Genki (元気)*
