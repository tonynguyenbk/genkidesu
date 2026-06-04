# GENKI (元気) — AI Family Nutrition Platform

## Project Overview
Genki is a Vietnamese family nutrition tracking app powered by AI photo recognition. Users take photos of their meals and the AI identifies dishes, estimates portions, and calculates nutritional data. The app serves all family members — from babies to grandparents — with adaptive UI per age group.

**Target market**: Vietnam first, then Southeast Asia.
**Competitor**: Wao (1.5M users, but no family features, no web app, no wearable sync).

## Tech Stack
- **Frontend**: Expo SDK 52+ universal (single codebase → iOS + Android + Web)
- **Backend**: Node.js 22 + Fastify 5 + tRPC v11
- **Database**: PostgreSQL 16 + Prisma 6 + pgvector + TimescaleDB
- **AI**: Claude Sonnet Vision API (via abstraction layer) + RAG with Vietnamese food DB
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Storage**: Cloudflare R2 (images)
- **Infra**: Railway (MVP) → AWS (scale)
- **Language**: TypeScript strict mode everywhere

## Monorepo Structure
```
genki/
├── apps/
│   └── mobile/              # Expo Universal (iOS + Android + Web)
│       ├── app/             # Expo Router screens
│       ├── components/      # UI components
│       ├── hooks/           # Custom hooks
│       └── lib/             # tRPC client, storage, theme
├── packages/
│   ├── api/                 # Fastify + tRPC server
│   │   ├── routers/         # auth, profile, family, meal, ai, activity
│   │   ├── services/        # Business logic
│   │   ├── ai/              # AI abstraction layer (vision, rag, chat, prompts/)
│   │   ├── integrations/    # HealthKit, Google Fit, Garmin, Strava
│   │   └── jobs/            # BullMQ processors
│   ├── db/                  # Prisma schema + migrations + seed
│   ├── shared/              # Types, validators (Zod), constants, utils
│   └── ui/                  # Design system (themes: adult, senior, teen, baby)
├── docker-compose.yml       # Local dev: Postgres + Redis
└── turbo.json
```

## Architecture Decisions (DO NOT CHANGE)
1. **Multi-profile schema**: `users` table separate from `profiles` table. 1 user → many profiles (self, baby, parents). This is the foundation of the family system.
2. **AI abstraction layer**: All AI calls go through `packages/api/ai/`. NEVER call Claude API directly from routers/controllers. This allows swapping models later.
3. **Encryption**: Health data encrypted at-rest. Use pgcrypto for sensitive fields.
4. **Adaptive UI**: Each profile type (adult/baby/teen/senior) has its own theme. Senior: font 18-22px, simplified flow. Teen: gamification. Baby: pastel, parent-controlled.
5. **Platform detection**: Use `Platform.OS` from react-native. Mobile gets native camera/HealthKit. Web gets file upload/webcam.

## Coding Standards
- Language: TypeScript strict mode, no `any`
- Code language: English (variable names, comments)
- UI language: Vietnamese (default)
- Git: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Branch: `main` → `develop` → `feature/xxx`
- Formatting: Prettier (2 spaces, single quotes, trailing commas)
- Linting: ESLint with recommended config
- Testing: Vitest for unit, Playwright for E2E critical flows
- Naming: camelCase for variables/functions, PascalCase for components/types, snake_case for DB columns (Prisma maps to camelCase)

## Key Commands
```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Start all apps (mobile + api)
docker compose up -d            # Start Postgres + Redis
pnpm --filter api dev           # Start API only
pnpm --filter db migrate        # Run Prisma migrations
pnpm --filter db seed           # Seed food database
pnpm --filter db studio         # Open Prisma Studio
pnpm typecheck                  # TypeScript check all packages
pnpm lint                       # ESLint all packages
pnpm test                       # Run all tests
npx expo start                  # Start Expo dev server (from apps/mobile/)
```

## Database Key Tables
- `users` — Auth accounts (Google/Apple/Phone)
- `profiles` — Family member profiles (type: adult/baby/teen/senior)
- `families` — Family groups with invite codes
- `family_members` — Profile ↔ Family junction (with privacy settings)
- `foods` — Vietnamese food database (2000+ items, with pgvector embeddings)
- `meal_logs` — Meal entries with AI recognition results
- `meal_items` — Individual food items within a meal
- `daily_summaries` — Aggregated daily nutrition (TimescaleDB)
- `health_conditions` — Medical conditions + dietary restrictions
- `activity_logs` — Exercise/wearable data

## AI Integration Pattern
```
Photo → Resize/Compress → Upload R2 → Check Cache (Redis)
  → [cache miss] → Claude Sonnet Vision API
  → RAG: pgvector search in foods table
  → Health condition check → Generate alerts
  → Return JSON to client → User confirms/edits → Save meal_log
```

## Important Context
- The full product spec is at @docs/genki-product-spec.md
- The Sprint 0 spec is at @docs/genki-sprint0-spec.md
- Vietnamese food data is critical — the AI must recognize phở, bánh mì, cơm tấm, etc.
- TDEE calculation uses Mifflin-St Jeor equation
- Nutrition targets follow Vietnamese RDA (Viện Dinh dưỡng Quốc gia)
- Privacy: teens can hide meal details from parents
- Senior UI: minimum font 18px, max 2 steps for any action

## What NOT to Do
- Don't create a separate web app (apps/web/). Expo Web handles it.
- Don't call Claude API directly from routers. Use the AI abstraction layer.
- Don't use MongoDB. We use PostgreSQL for relational family data + ACID.
- Don't use Flutter or Dart. The team uses TypeScript only.
- Don't hardcode nutrition values. Always reference the foods table.
- Don't skip input validation. Use Zod schemas from packages/shared.
