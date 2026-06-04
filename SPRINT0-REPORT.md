# Genki (元気) — Sprint 0 Setup Report

> **Ngày hoàn thành**: 05/06/2026  
> **Sprint**: 0 — Foundation & Architecture  
> **Thực hiện bởi**: Claude Code + PM/Lead  
> **Repo**: https://github.com/tonynguyenbk/genkidesu

---

## Tổng quan

Sprint 0 đã hoàn thành toàn bộ nền móng kỹ thuật cho dự án Genki — ứng dụng dinh dưỡng gia đình Việt Nam. Monorepo đầy đủ đã được dựng từ đầu trên Windows 10, bao gồm backend API, database schema, design system, và Expo universal app (iOS + Android + Web từ 1 codebase).

---

## Những gì đã hoàn thành

### ✅ Task 0.1 — Monorepo Init (Turborepo + pnpm)

**Cấu trúc workspace:**
```
GENKIdesu/
├── apps/
│   └── mobile/              ← Expo Universal (iOS + Android + Web)
├── packages/
│   ├── api/                 ← Fastify 5 + tRPC v11
│   ├── db/                  ← Prisma 6 + PostgreSQL 16
│   ├── shared/              ← Types, Zod validators, utils
│   └── ui/                  ← Design system (4 themes)
├── docs/
│   ├── genki-product-spec.md
│   └── genki-sprint0-spec.md
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env / .env.example
└── .github/workflows/ci.yml
```

**Công cụ cài đặt:**
- pnpm 11.5.1 (package manager)
- turbo 2.9.16 (monorepo build)
- TypeScript 5.9.3 strict mode toàn bộ packages
- Prettier + ESLint configured

---

### ✅ Task 0.2 — Expo Universal App (`apps/mobile`)

**Screens đã tạo (Expo Router v4):**

| Route | File | Mô tả |
|-------|------|--------|
| `/` | `app/index.tsx` | Redirect → login hoặc tabs |
| `/(auth)/login` | `app/(auth)/login.tsx` | Màn hình đăng nhập (Google/Apple/SĐT) |
| `/(auth)/phone-otp` | `app/(auth)/phone-otp.tsx` | OTP 6 digits, auto-focus |
| `/(tabs)/` | `app/(tabs)/index.tsx` | Home dashboard (placeholder) |
| `/(tabs)/camera` | `app/(tabs)/camera.tsx` | Chụp ảnh (placeholder Sprint 2) |
| `/(tabs)/stats` | `app/(tabs)/stats.tsx` | Thống kê (placeholder Sprint 3) |
| `/(tabs)/family` | `app/(tabs)/family.tsx` | Dashboard gia đình |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Hồ sơ + đăng xuất |
| `/profile/create` | `app/profile/create.tsx` | Onboarding 4 bước với TDEE |
| `/family/create` | `app/family/create.tsx` | Tạo gia đình + invite code |
| `/family/join` | `app/family/join.tsx` | Join bằng invite code |

**Libraries:**
```json
"expo": "~52.0.28",
"expo-router": "~4.0.16",
"expo-secure-store": "~14.0.1",
"@tanstack/react-query": "^5.62.9",
"@trpc/react-query": "^11.0.0"
```

**Platform detection:** `Platform.OS` → tab bar (mobile) / sidebar web, native camera / file upload web, SecureStore / localStorage.

---

### ✅ Task 0.3 — Backend API Init (`packages/api`)

**Stack:**
- Fastify 5 server
- tRPC v11 (type-safe end-to-end)
- `jose` library cho JWT (HS256)
- Dev port: **4000**

**Routers đã implement đầy đủ logic:**

| Router | Procedures |
|--------|-----------|
| `auth` | `loginWithGoogle`, `sendOTP`, `verifyOTP`, `refresh`, `logout`, `me` |
| `profile` | `create`, `list`, `update`, `calculateTDEE` |
| `family` | `create`, `list`, `getDashboard`, `regenerateInvite`, `join`, `addChildProfile`, `updatePrivacy`, `leave` |

**Auth flow:**
```
sendOTP → [dev: log to console] → verifyOTP → JWT (15m) + Refresh (30d) → Session DB
```

**Health endpoint:** `GET /health` → `{ status: "ok", timestamp: "..." }`

**Đã test thành công:** API khởi động, health endpoint trả 200 OK.

---

### ✅ Task 0.5 — Prisma Schema + Migration (`packages/db`)

**12 tables đã migrate thành công:**

| Table | Mô tả |
|-------|--------|
| `users` | Auth accounts (Google/Apple/Phone) |
| `sessions` | JWT session storage |
| `profiles` | Multi-profile (adult/baby/teen/senior) |
| `families` | Family groups với invite code 8 ký tự |
| `family_members` | Profile ↔ Family junction + privacy settings |
| `health_conditions` | Bệnh lý + chế độ ăn đặc biệt |
| `foods` | Vietnamese food DB (pgvector embedding) |
| `meal_logs` | Nhật ký bữa ăn |
| `meal_items` | Từng món trong bữa ăn |
| `daily_summaries` | Tổng hợp dinh dưỡng hàng ngày |
| `activity_logs` | Nhật ký hoạt động / wearable |
| `_prisma_migrations` | Migration history |

**Migration:** `20260604155155_init` — applied thành công.

**Extensions enabled:** `pgvector` (cho RAG pipeline), `pgcrypto` (cho mã hóa).

---

### ✅ `packages/shared` — Types, Validators, Utils

**Exports:**
- `types/` — TypeScript interfaces: `User`, `Profile`, `Family`, `FamilyMember`, `AuthTokens`, `NutritionTargets`, `UiPreferences`
- `validators/` — Zod schemas: `auth.ts`, `profile.ts`, `family.ts`
- `utils/tdee.ts` — Mifflin-St Jeor TDEE calculation
- `utils/inviteCode.ts` — Random 8-char alphanumeric invite code generator
- `constants/nutrition.ts` — Default nutrition targets theo profile type

---

### ✅ `packages/ui` — Design System (4 themes)

| Theme | Profile | Đặc điểm |
|-------|---------|-----------|
| `adult` | adult | primary `#2ECC71`, font base 16px |
| `senior` | senior | font base **18px**, high contrast |
| `teen` | teen | primary `#8B5CF6`, vibrant |
| `baby` | baby | primary `#EC4899`, pastel `#FFF5F9` |

---

### ✅ Docker Setup

**Services:**
```yaml
postgres:  pgvector/pgvector:pg16  → port 5433 (5432 bị chiếm bởi local PG)
redis:     redis:7-alpine           → port 6379
```

> **Lưu ý quan trọng**: Máy đã có PostgreSQL local cài sẵn trên port 5432. Docker Postgres dùng port **5433**.

**DATABASE_URL:**
```
postgresql://genki:genki_dev_2026@localhost:5433/genki
```

---

### ✅ CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
on: push/PR to main, develop
jobs:
  check: typecheck → lint → test
  deploy: (main only) → Railway
```

---

## Môi trường đã cài đặt

| Tool | Version |
|------|---------|
| Node.js | v24.14.1 |
| npm | 11.11.0 |
| pnpm | 11.5.1 |
| Docker Desktop | 29.5.2 |
| TypeScript | 5.9.3 |

---

## Cách chạy

### 1. Start database
```bash
docker compose up -d
```

### 2. Build shared package (cần làm 1 lần hoặc khi thay đổi shared)
```bash
pnpm --filter @genki/shared build
```

### 3. Chạy toàn bộ stack
```bash
pnpm dev
# API: http://localhost:4000
# Mobile/Web: http://localhost:8081
```

### 4. Chạy riêng từng package
```bash
pnpm --filter api dev          # API server only
pnpm --filter db studio        # Prisma Studio (DB viewer)
pnpm --filter db migrate       # Chạy migration mới
pnpm --filter db seed          # Seed food data
```

### 5. Kiểm tra
```bash
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm test         # Vitest
```

---

## Vấn đề gặp phải & Cách giải quyết

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Port 5432 bị chiếm | PostgreSQL đã cài sẵn trên Windows | Docker dùng port 5433 |
| `pnpm install` fail `@types/react-native` | RN 0.76+ bundle types riêng | Xóa `@types/react-native` khỏi dependencies |
| `pnpm` build scripts bị block | pnpm 11 security default | `allowBuilds` trong `pnpm-workspace.yaml` |
| Node.js v24 `--loader` deprecated | tsx cần `--import` hoặc CLI | Dùng `tsx watch` CLI trực tiếp |
| `@genki/shared` không export | ESM resolution với `.js` → `.ts` | Build shared trước, turbo `dev` dependsOn `^build` |

---

## Các file cấu hình quan trọng

| File | Mục đích |
|------|---------|
| `packages/db/.env` | DATABASE_URL cho Prisma |
| `packages/api/.env` | DATABASE_URL + JWT_SECRET cho API |
| `.env` | Root env vars |
| `pnpm-workspace.yaml` | Workspace + allowBuilds |
| `turbo.json` | Build pipeline (dev dependsOn ^build) |
| `tsconfig.base.json` | TypeScript strict config dùng chung |

---

## Definition of Done — Sprint 0

- [x] Monorepo structure đúng theo spec
- [x] `pnpm install` thành công
- [x] Prisma schema migrate (12 tables)
- [x] API server chạy port 4000, health endpoint OK
- [x] Docker: Postgres + Redis healthy
- [x] Auth router (OTP/Google/Apple stubs)
- [x] Profile router (CRUD + TDEE Mifflin-St Jeor)
- [x] Family router (create/join/invite/privacy)
- [x] Expo app với 11 screens (placeholder)
- [x] 4-step onboarding UI
- [x] Design system 4 themes (adult/senior/teen/baby)
- [x] CI/CD pipeline (GitHub Actions)
- [x] TypeScript strict mode toàn bộ packages
- [ ] Auth Google/Apple thật (cần credentials — Sprint 1)
- [ ] Expo app chạy trên iOS/Android simulator (cần Xcode/Android Studio)
- [ ] 200 món ăn seed data (chỉ có 10 mẫu — Sprint 1)
- [ ] Sentry error tracking (cần DSN)

---

## Sprint 1 — Chuẩn bị tiếp theo

**Tasks tiếp theo:**
1. `Task 0.6` — Auth Backend hoàn chỉnh (Google OAuth + Apple Sign-In với credentials thật)
2. `Task 0.7` — Auth UI hoàn thiện (loading states, error handling)
3. `Task 0.8/0.9` — Profile system + onboarding polish
4. `Task 0.10/0.11` — Family UI hoàn chỉnh
5. `Task 0.14` — Seed 200 món ăn Việt Nam
6. `Sprint 1` — Design System + Adaptive UI engine

**Cần chuẩn bị:**
- Google OAuth credentials (console.cloud.google.com)
- Apple Developer account (Sign in with Apple)
- Sentry DSN (sentry.io)
- Railway account cho staging deployment

---

*Report generated: 05/06/2026 · Genki (元気) Sprint 0*
