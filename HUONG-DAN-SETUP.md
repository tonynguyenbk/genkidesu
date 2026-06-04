# Hướng dẫn setup Genki với Claude Code + VS Code

> Dành cho CEO — chạy trên MacBook/laptop cá nhân
> Thời gian: ~30 phút

---

## Bước 1: Cài đặt công cụ cần thiết

### 1.1. Node.js 22 LTS
```bash
# Cài bằng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.zshrc
nvm install 22
nvm use 22
node -v  # Phải hiện v22.x.x
```

### 1.2. pnpm (package manager)
```bash
npm install -g pnpm
pnpm -v  # Phải hiện 9.x.x
```

### 1.3. Docker Desktop
- Tải tại: https://www.docker.com/products/docker-desktop/
- Cài xong, mở Docker Desktop và để nó chạy nền

### 1.4. VS Code
- Tải tại: https://code.visualstudio.com/
- Cài extensions:
  - **Claude Code** (Anthropic) — tìm "Claude" trong Extensions
  - **Prisma** — syntax highlighting cho database schema
  - **ESLint** — linting
  - **Prettier** — formatting
  - **Expo Tools** — hỗ trợ Expo

### 1.5. Claude Code CLI
```bash
# Cài Claude Code command line
npm install -g @anthropic-ai/claude-code

# Login
claude login

# Kiểm tra
claude --version
```

### 1.6. Expo CLI + EAS
```bash
npm install -g expo-cli eas-cli

# Login Expo account (tạo tại expo.dev nếu chưa có)
eas login
```

### 1.7. Xcode (nếu dùng Mac — cần cho iOS simulator)
- Mở App Store → tìm "Xcode" → cài (tốn ~12GB, mất ~30 phút)
- Sau khi cài: mở Xcode → Settings → Platforms → tải iOS Simulator

### 1.8. Android Studio (cho Android emulator)
- Tải tại: https://developer.android.com/studio
- Cài xong → mở → More Actions → Virtual Device Manager → tạo Pixel 8 emulator

---

## Bước 2: Tạo project

### 2.1. Tạo repo trên GitHub
```bash
# Tạo repo mới trên github.com (tên: genki)
# Clone về máy
git clone https://github.com/YOUR_USERNAME/genki.git
cd genki
```

### 2.2. Copy các file tài liệu vào project
```bash
# Tạo thư mục docs
mkdir -p docs

# Copy 3 file đã tải từ Claude chat vào:
# - docs/genki-product-spec.md    (product spec tổng)
# - docs/genki-sprint0-spec.md    (sprint 0 chi tiết)
# - CLAUDE.md                      (file gốc project — ĐẶT Ở ROOT)
```

**Cấu trúc sau khi copy:**
```
genki/
├── CLAUDE.md                    ← Claude Code đọc file này đầu tiên
├── docs/
│   ├── genki-product-spec.md    ← Spec tổng
│   └── genki-sprint0-spec.md    ← Sprint 0 chi tiết
└── .gitignore
```

---

## Bước 3: Chạy Claude Code

### 3.1. Mở project trong VS Code
```bash
code .   # Mở VS Code tại thư mục genki/
```

### 3.2. Mở Claude Code trong VS Code
- Nhấn `Cmd+Shift+P` (Mac) hoặc `Ctrl+Shift+P` (Windows)
- Gõ "Claude Code" → chọn "Claude Code: Open"
- Hoặc mở Terminal trong VS Code và gõ: `claude`

### 3.3. Bắt đầu Sprint 0
Paste prompt này vào Claude Code:

```
Đọc file CLAUDE.md và docs/genki-sprint0-spec.md.

Bắt đầu Task 0.1 — Monorepo Init:
1. Tạo monorepo với Turborepo + pnpm
2. Setup packages: api, db, shared, ui
3. Setup apps/mobile với Expo SDK 52+ universal
4. Tạo docker-compose.yml cho Postgres (pgvector) + Redis
5. Tạo .env.example
6. Setup TypeScript strict mode cho tất cả packages
7. Đảm bảo `pnpm dev` chạy được

Sau khi xong, chạy tiếp Task 0.5 — Prisma Schema theo spec.
```

### 3.4. Các prompt tiếp theo cho từng Task

**Task 0.5 — Database:**
```
Đọc docs/genki-sprint0-spec.md phần Task 0.5.
Tạo Prisma schema đầy đủ với tất cả models đã spec.
Chạy migrate và đảm bảo Prisma Studio mở được.
```

**Task 0.6 — Auth Backend:**
```
Đọc docs/genki-sprint0-spec.md phần Task 0.6.
Implement auth router với tRPC:
- loginWithGoogle, loginWithApple, sendOTP, verifyOTP
- JWT access token (15min) + refresh token (30 days)
- Session management trong database
Dev mode: OTP log ra console thay vì gửi SMS.
```

**Task 0.7 — Auth UI:**
```
Đọc docs/genki-sprint0-spec.md phần Task 0.7.
Tạo màn hình login trong apps/mobile/app/(auth)/:
- Login screen với 3 nút: Google, Apple, SĐT
- OTP input screen (6 digits, auto-focus)
- Loading states và error handling
Phải chạy được trên cả iOS simulator VÀ web browser.
```

**Task 0.8 + 0.9 — Profile:**
```
Đọc docs/genki-sprint0-spec.md phần Task 0.8 và 0.9.
Implement profile system:
- Backend: CRUD profile, TDEE calculation (Mifflin-St Jeor), nutrition targets
- Frontend: Onboarding flow 4 bước (chào mừng → thông tin → chỉ số → kết quả)
- Profile switcher component
Adaptive UI: senior profile phải có font lớn hơn.
```

**Task 0.10 + 0.11 — Family:**
```
Đọc docs/genki-sprint0-spec.md phần Task 0.10 và 0.11.
Implement family system:
- Backend: tạo gia đình, generate invite code 8 ký tự, join bằng code, privacy settings
- Frontend: tạo gia đình, hiển thị invite code (copy/share), nhập code để join
- Tạo child profile (baby/teen) trong gia đình
```

---

## Bước 4: Chạy ứng dụng

### 4.1. Start database
```bash
docker compose up -d
```

### 4.2. Start API
```bash
pnpm --filter api dev
# API chạy ở http://localhost:4000
```

### 4.3. Start Expo (mobile + web)
```bash
cd apps/mobile
npx expo start
# Nhấn 'i' → mở iOS simulator
# Nhấn 'a' → mở Android emulator
# Nhấn 'w' → mở web browser
```

---

## Bước 5: Tips dùng Claude Code hiệu quả

### Quy tắc vàng
1. **Luôn reference file spec**: Bắt đầu prompt bằng "Đọc docs/genki-sprint0-spec.md phần Task X.Y"
2. **Một task một lúc**: Không yêu cầu Claude Code làm 5 task cùng lúc
3. **Review trước khi accept**: Đọc code Claude Code sinh ra, hỏi nếu không hiểu
4. **Commit thường xuyên**: Sau mỗi task hoàn thành, commit + push

### Khi Claude Code bị lỗi
```
# Reset context nếu Claude Code bị "confused"
/clear

# Nếu code bị lỗi, paste error message:
"Lỗi này xuất hiện khi chạy `pnpm dev`: [paste error]
Đọc lại CLAUDE.md và fix."
```

### Khi cần thêm tính năng ngoài spec
```
"Đọc docs/genki-product-spec.md phần [section].
Implement [tính năng] theo đúng tech stack và coding standards trong CLAUDE.md.
Tạo test cho tính năng này."
```

---

## Checklist cuối Sprint 0

Chạy trong terminal để verify:

```bash
# 1. TypeScript không lỗi
pnpm typecheck

# 2. Lint pass
pnpm lint

# 3. Database chạy
pnpm --filter db studio    # Mở Prisma Studio, kiểm tra tables

# 4. API chạy
curl http://localhost:4000/trpc/health

# 5. App chạy trên 3 platforms
cd apps/mobile && npx expo start
# Test: i (iOS), a (Android), w (Web)

# 6. Auth flow hoạt động
# Mở app → đăng nhập → tạo profile → tạo gia đình
```

---

## Cấu trúc file cuối cùng sau Sprint 0

```
genki/
├── CLAUDE.md                          ← Claude Code instructions
├── docs/
│   ├── genki-product-spec.md          ← Product spec
│   └── genki-sprint0-spec.md          ← Sprint 0 spec
├── apps/
│   └── mobile/                        ← Expo Universal app
│       ├── app/                       ← Screens (Expo Router)
│       ├── components/                ← UI components
│       ├── hooks/                     ← Custom hooks
│       ├── lib/                       ← Utilities
│       └── app.json                   ← Expo config
├── packages/
│   ├── api/                           ← Backend server
│   ├── db/                            ← Prisma + migrations
│   ├── shared/                        ← Shared types + validators
│   └── ui/                            ← Design system
├── docker-compose.yml                 ← Postgres + Redis
├── turbo.json                         ← Turborepo config
├── package.json                       ← Root workspace
├── .env                               ← Environment variables (KHÔNG commit)
├── .env.example                       ← Template env vars
└── .github/workflows/ci.yml           ← CI/CD pipeline
```

---

*Có vấn đề gì trong quá trình setup, hỏi Claude Code hoặc liên hệ PM.*
