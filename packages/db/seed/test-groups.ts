import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TEST DATASET — nhóm gia đình + cộng đồng, users, hồ sơ và lịch sử bữa ăn.
//
// Chạy:      pnpm --filter db seed:test
// Idempotent: xóa sạch dữ liệu test cũ (SĐT 09000000xx) rồi tạo lại từ đầu.
//
// Đăng nhập bằng SĐT bất kỳ bên dưới (OTP hiện ngay trên màn hình ở dev):
//   0900000001  Minh   — chủ nhóm GIA ĐÌNH, có 3 hồ sơ (Minh, Bé Na, Ông Tuấn),
//                        đồng thời là thành viên cộng đồng gym
//   0900000002  Lan    — chủ nhóm CỘNG ĐỒNG gym, thành viên nhóm gia đình
//   0900000003..08     — Hùng, Trang, Đức, Mai, Quân, Hoa (thành viên gym,
//                        streak khác nhau để leaderboard có thứ hạng)
//
// Mã mời cố định:  GIADINH1 (gia đình) · GYMGENKI (cộng đồng)
// ============================================================================

const PHONE_PREFIX = '09000000';
const OFFSET_MS = Number(process.env['APP_TZ_OFFSET_MINUTES'] ?? 420) * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// VN calendar date (as UTC-midnight Date) of "today minus N days".
function dayKey(daysAgo: number): Date {
  const shifted = new Date(Date.now() + OFFSET_MS - daysAgo * DAY);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

// UTC instant for hh:mm VN time on the given day.
function atVN(day: Date, hour: number, minute = 0): Date {
  return new Date(day.getTime() - OFFSET_MS + (hour * 60 + minute) * 60 * 1000);
}

// Per-portion dish presets (matched against `foods` by name when available).
const DISHES = {
  pho: { name: 'Phở bò tái', portionG: 450, kcal: 420, p: 28, c: 52, f: 8 },
  comTam: { name: 'Cơm tấm sườn nướng', portionG: 400, kcal: 580, p: 32, c: 72, f: 16 },
  bunBo: { name: 'Bún bò Huế', portionG: 500, kcal: 460, p: 30, c: 55, f: 12 },
  banhMi: { name: 'Bánh mì thịt', portionG: 150, kcal: 320, p: 16, c: 42, f: 9 },
  chao: { name: 'Cháo thịt bằm', portionG: 350, kcal: 280, p: 12, c: 45, f: 5 },
  canhChua: { name: 'Canh chua cá', portionG: 250, kcal: 120, p: 10, c: 8, f: 4 },
  babyMilk: { name: 'Sữa công thức', portionG: 180, kcal: 120, p: 3, c: 14, f: 5 },
  babyChao: { name: 'Cháo ăn dặm bí đỏ', portionG: 200, kcal: 150, p: 5, c: 25, f: 3 },
} as const;

type DishKey = keyof typeof DISHES;
type MealPlan = Array<{ mealType: string; hour: number; dishes: DishKey[] }>;

// "On-target" day for a 1800 kcal goal → 1780 kcal (trong khoảng 90–110%).
const FULL_DAY: MealPlan = [
  { mealType: 'breakfast', hour: 7, dishes: ['pho'] },
  { mealType: 'lunch', hour: 12, dishes: ['comTam'] },
  { mealType: 'dinner', hour: 19, dishes: ['bunBo', 'banhMi'] },
];
// Light day → 740 kcal (dưới mục tiêu, sinh cảnh báo)
const LIGHT_DAY: MealPlan = [
  { mealType: 'breakfast', hour: 7, dishes: ['chao'] },
  { mealType: 'dinner', hour: 19, dishes: ['bunBo'] },
];
const SENIOR_DAY: MealPlan = [
  { mealType: 'breakfast', hour: 7, dishes: ['chao'] },
  { mealType: 'lunch', hour: 11, dishes: ['canhChua', 'chao'] },
];
const BABY_DAY: MealPlan = [
  { mealType: 'formula', hour: 6, dishes: ['babyMilk'] },
  { mealType: 'baby_meal', hour: 11, dishes: ['babyChao'] },
  { mealType: 'formula', hour: 15, dishes: ['babyMilk'] },
];

interface TestUser {
  phone: string;
  name: string;
  gender: 'male' | 'female';
  // daysAgo values on which this person logged meals (0 = hôm nay).
  // Consecutive-from-0 runs become the leaderboard streak.
  logDays: number[];
  plan?: MealPlan;
  lightDays?: number[]; // subset of logDays that use LIGHT_DAY (off-target)
}

const range = (n: number) => [...Array(n).keys()]; // [0..n-1]

const TEST_USERS: TestUser[] = [
  { phone: `${PHONE_PREFIX}01`, name: 'Minh', gender: 'male', logDays: range(7) },                          // streak 7
  { phone: `${PHONE_PREFIX}02`, name: 'Lan', gender: 'female', logDays: range(14) },                        // streak 14 🥇
  { phone: `${PHONE_PREFIX}03`, name: 'Hùng', gender: 'male', logDays: range(10), lightDays: [3, 5] },      // streak 10 🥈
  { phone: `${PHONE_PREFIX}04`, name: 'Trang', gender: 'female', logDays: range(5) },                       // streak 5
  { phone: `${PHONE_PREFIX}05`, name: 'Đức', gender: 'male', logDays: [0, 1, 4, 5, 6, 9, 10, 12] },         // gaps → streak 2
  { phone: `${PHONE_PREFIX}06`, name: 'Mai', gender: 'female', logDays: [0, 1], lightDays: [1] },           // streak 2
  { phone: `${PHONE_PREFIX}07`, name: 'Quân', gender: 'male', logDays: [0] },                               // streak 1
  { phone: `${PHONE_PREFIX}08`, name: 'Hoa', gender: 'female', logDays: [] },                               // chưa log gì
];

async function wipeOldTestData() {
  const testUsers = await prisma.user.findMany({
    where: { phone: { startsWith: PHONE_PREFIX } },
    select: { id: true },
  });
  const ids = testUsers.map((u) => u.id);
  if (ids.length === 0) return;
  // Families owned by test users have no cascade — remove them explicitly.
  // meal_sync_events reference families; profiles/logs cascade with the user.
  const fams = await prisma.family.findMany({ where: { ownerId: { in: ids } }, select: { id: true } });
  if (fams.length) {
    await prisma.mealSyncEvent.deleteMany({ where: { familyId: { in: fams.map((f) => f.id) } } });
    await prisma.family.deleteMany({ where: { id: { in: fams.map((f) => f.id) } } });
  }
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Đã xóa ${ids.length} test user cũ (+ nhóm, hồ sơ, bữa ăn liên quan).`);
}

// Resolve each dish preset against the real foods table so meal items carry a
// foodId when possible (falls back to name-override-only items).
async function resolveFoodIds(): Promise<Map<DishKey, string>> {
  const map = new Map<DishKey, string>();
  for (const [key, d] of Object.entries(DISHES) as Array<[DishKey, (typeof DISHES)[DishKey]]>) {
    const food = await prisma.food.findFirst({
      where: { nameVi: { equals: d.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (food) map.set(key, food.id);
  }
  return map;
}

async function createMealHistory(
  profileId: string,
  goalKcal: number,
  user: Pick<TestUser, 'logDays' | 'lightDays'>,
  plan: MealPlan | undefined,
  foodIds: Map<DishKey, string>,
  defaultPlan: MealPlan = FULL_DAY,
) {
  const lightSet = new Set(user.lightDays ?? []);

  for (const daysAgo of user.logDays) {
    const day = dayKey(daysAgo);
    const dayPlan = plan ?? (lightSet.has(daysAgo) ? LIGHT_DAY : defaultPlan);

    let totCal = 0, totP = 0, totC = 0, totF = 0, meals = 0;
    for (const meal of dayPlan) {
      const loggedAt = atVN(day, meal.hour, 15);
      await prisma.mealLog.create({
        data: {
          profileId,
          mealType: meal.mealType,
          loggedAt,
          userConfirmed: true,
          aiConfidence: 0.9,
          items: {
            create: meal.dishes.map((k) => {
              const d = DISHES[k];
              totCal += d.kcal; totP += d.p; totC += d.c; totF += d.f;
              return {
                foodId: foodIds.get(k) ?? null,
                foodNameOverride: d.name,
                portionGrams: d.portionG,
                calories: d.kcal,
                proteinG: d.p,
                carbsG: d.c,
                fatG: d.f,
                aiDetected: true,
              };
            }),
          },
        },
      });
      meals += 1;
    }

    await prisma.dailySummary.create({
      data: {
        profileId,
        summaryDate: day,
        totalCalories: totCal,
        totalProteinG: totP,
        totalCarbsG: totC,
        totalFatG: totF,
        netCalories: totCal,
        mealCount: meals,
      },
    });
  }
}

async function main() {
  await wipeOldTestData();
  const foodIds = await resolveFoodIds();

  const adultTargets = (kcal: number): Prisma.InputJsonValue => ({
    calories: kcal, protein_g: 80, carbs_g: 250, fat_g: 60,
  });

  // ── Users + hồ sơ chính ──────────────────────────────────────────────────
  const userRows = new Map<string, { userId: string; profileId: string }>();
  for (const u of TEST_USERS) {
    const user = await prisma.user.create({
      data: { phone: u.phone, authProvider: 'phone', isActive: true },
    });
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: u.name,
        type: 'adult',
        gender: u.gender,
        birthDate: new Date('1992-06-15'),
        heightCm: u.gender === 'male' ? 172 : 160,
        weightKg: u.gender === 'male' ? 68 : 54,
        activityLevel: 3,
        tdeeKcal: 1800,
        nutritionTargets: adultTargets(1800),
        uiPreferences: { font_scale: 1.0, theme: 'default', simplified_mode: false },
      },
    });
    userRows.set(u.name, { userId: user.id, profileId: profile.id });
  }

  // Hồ sơ phụ thuộc của Minh: Bé Na (baby) + Ông Tuấn (senior)
  const minh = userRows.get('Minh')!;
  const beNa = await prisma.profile.create({
    data: {
      userId: minh.userId,
      name: 'Bé Na',
      type: 'baby',
      gender: 'female',
      birthDate: new Date('2025-03-01'),
      nutritionTargets: { calories: 900, protein_g: 20, carbs_g: 120, fat_g: 35 },
      uiPreferences: { font_scale: 1.0, theme: 'pastel', simplified_mode: false },
    },
  });
  const ongTuan = await prisma.profile.create({
    data: {
      userId: minh.userId,
      name: 'Ông Tuấn',
      type: 'senior',
      gender: 'male',
      birthDate: new Date('1955-01-20'),
      heightCm: 165,
      weightKg: 60,
      activityLevel: 1,
      tdeeKcal: 1600,
      nutritionTargets: { calories: 1600, protein_g: 65, carbs_g: 210, fat_g: 50 },
      uiPreferences: { font_scale: 1.4, theme: 'default', simplified_mode: true },
    },
  });

  // ── Nhóm gia đình (GIADINH1) ─────────────────────────────────────────────
  const lan = userRows.get('Lan')!;
  await prisma.family.create({
    data: {
      ownerId: minh.userId,
      name: 'Gia đình Minh',
      type: 'family',
      maxMembers: 10,
      inviteCode: 'GIADINH1',
      members: {
        create: [
          { profileId: minh.profileId, role: 'owner' },
          { profileId: beNa.id, role: 'child' },
          { profileId: ongTuan.id, role: 'member' },
          { profileId: lan.profileId, role: 'member' },
        ],
      },
    },
  });

  // ── Nhóm cộng đồng (GYMGENKI) — privacy-first mặc định ─────────────────
  const communityPrivacy = { show_details_to_family: false, show_meal_logs: false };
  await prisma.family.create({
    data: {
      ownerId: lan.userId,
      name: 'Hội Gym Khỏe Mỗi Ngày',
      type: 'community',
      maxMembers: 500,
      inviteCode: 'GYMGENKI',
      members: {
        create: TEST_USERS.map((u) => ({
          profileId: userRows.get(u.name)!.profileId,
          role: u.name === 'Lan' ? ('owner' as const) : ('member' as const),
          privacySettings: communityPrivacy,
        })),
      },
    },
  });

  // ── Lịch sử bữa ăn (leaderboard + dashboard có số liệu) ─────────────────
  for (const u of TEST_USERS) {
    await createMealHistory(userRows.get(u.name)!.profileId, 1800, u, undefined, foodIds);
  }
  await createMealHistory(ongTuan.id, 1600, { logDays: range(7) }, SENIOR_DAY, foodIds);
  await createMealHistory(beNa.id, 900, { logDays: range(3) }, BABY_DAY, foodIds);

  const totalLogs = await prisma.mealLog.count({
    where: { profile: { user: { phone: { startsWith: PHONE_PREFIX } } } },
  });

  console.log(`
✅ Seed test hoàn tất — ${TEST_USERS.length} user, ${TEST_USERS.length + 2} hồ sơ, 2 nhóm, ${totalLogs} bữa ăn.

┌─ ĐĂNG NHẬP (OTP hiện ngay ở dev) ──────────────────────────────
│  0900000001  Minh   chủ nhóm gia đình (3 hồ sơ) + member gym
│  0900000002  Lan    chủ cộng đồng gym, streak 14 🥇
│  0900000003  Hùng   streak 10 🥈  ·  0900000004  Trang  streak 5
│  0900000005  Đức    streak 2 (có ngày bỏ)  ·  0900000006  Mai  streak 2
│  0900000007  Quân   streak 1  ·  0900000008  Hoa  chưa log gì
├─ MÃ MỜI ───────────────────────────────────────────────────────
│  GIADINH1  🏠 Gia đình Minh (Minh, Bé Na, Ông Tuấn, Lan)
│  GYMGENKI  🌍 Hội Gym Khỏe Mỗi Ngày (8 thành viên)
└────────────────────────────────────────────────────────────────
Gợi ý test: login 0900000001 → tab Nhóm có cả 2 nhóm (chip chuyển đổi);
nhóm gia đình thấy cảnh báo Ông Tuấn ăn thiếu; cộng đồng thấy leaderboard.
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
