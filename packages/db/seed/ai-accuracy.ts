import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI recognition accuracy report — compares what the AI proposed
// (meal_logs.ai_raw_result) with what the user actually confirmed
// (meal_items) to measure recognition quality over time.
//
// A raw dish counts as:
//   - KEPT     — same name in the confirmed items, portion within ±15%
//   - ADJUSTED — same name, but the user changed the portion by more than ±15%
//   - DROPPED  — no confirmed item with that name (misrecognized or unwanted)
// Confirmed items whose name doesn't appear in the raw result were typed or
// renamed by the user (MANUAL/RENAMED) — each one is a dish the AI missed.
//
// Run: pnpm --filter db accuracy

const OFFSET_MS = Number(process.env['APP_TZ_OFFSET_MINUTES'] ?? 420) * 60 * 1000;
const PORTION_TOLERANCE = 0.15;

interface RawDish {
  nameVi?: string;
  portionG?: number;
  calories?: number;
  confidence?: number;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

// ISO week key (e.g. "2026-W27") of a UTC instant, in VN local time.
function weekKey(instant: Date): string {
  const d = new Date(instant.getTime() + OFFSET_MS);
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - dow); // ISO: week contains Thursday
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

interface WeekStats {
  scans: number;
  rawDishes: number;
  kept: number;
  adjusted: number;
  dropped: number;
  manual: number;
  portionErrSum: number; // relative portion error across name-matched dishes
  portionErrN: number;
}

function emptyWeek(): WeekStats {
  return { scans: 0, rawDishes: 0, kept: 0, adjusted: 0, dropped: 0, manual: 0, portionErrSum: 0, portionErrN: 0 };
}

async function main() {
  const logs = await prisma.mealLog.findMany({
    where: { aiRawResult: { not: null as never }, userConfirmed: true },
    include: { items: true },
    orderBy: { loggedAt: 'asc' },
  });

  if (logs.length === 0) {
    console.log('Chưa có meal log nào kèm ai_raw_result — cần user xác nhận vài lượt scan trước.');
    return;
  }

  const weeks = new Map<string, WeekStats>();
  const dropCounts = new Map<string, number>(); // raw name → times dropped
  let lowConfidenceKept = 0;
  let highConfidenceDropped = 0;

  let mockSkipped = 0;
  for (const log of logs) {
    const raw = log.aiRawResult as { dishes?: RawDish[]; fromMock?: boolean } | null;
    // Mock results (dev without AI keys) are random dishes — counting them
    // would poison the accuracy numbers in both directions.
    if (raw?.fromMock) { mockSkipped += 1; continue; }
    const rawDishes = raw?.dishes ?? [];
    if (rawDishes.length === 0) continue;

    const wk = weekKey(log.loggedAt);
    const stats = weeks.get(wk) ?? emptyWeek();
    weeks.set(wk, stats);
    stats.scans += 1;
    stats.rawDishes += rawDishes.length;

    const finalByName = new Map(
      log.items.map((it) => [normalize(it.foodNameOverride ?? ''), it]),
    );
    const matchedFinalNames = new Set<string>();

    for (const dish of rawDishes) {
      const name = normalize(dish.nameVi ?? '');
      const match = name ? finalByName.get(name) : undefined;
      if (!match) {
        stats.dropped += 1;
        if (name) dropCounts.set(name, (dropCounts.get(name) ?? 0) + 1);
        if ((dish.confidence ?? 0) >= 0.85) highConfidenceDropped += 1;
        continue;
      }
      matchedFinalNames.add(name);
      const rawPortion = dish.portionG ?? 0;
      const err = rawPortion > 0 ? Math.abs(match.portionGrams - rawPortion) / rawPortion : 0;
      stats.portionErrSum += err;
      stats.portionErrN += 1;
      if (err <= PORTION_TOLERANCE) {
        stats.kept += 1;
        if ((dish.confidence ?? 1) < 0.7) lowConfidenceKept += 1;
      } else {
        stats.adjusted += 1;
      }
    }

    for (const it of log.items) {
      if (!matchedFinalNames.has(normalize(it.foodNameOverride ?? ''))) stats.manual += 1;
    }
  }

  console.log('=== BÁO CÁO ĐỘ CHÍNH XÁC AI (theo tuần, giờ VN) ===\n');
  console.log('Tuần       | Scan | Món AI | Giữ nguyên | Chỉnh KP | Bỏ/Sai | Nhập tay | Lệch KP TB');
  console.log('-----------|------|--------|------------|----------|--------|----------|----------');
  for (const [wk, s] of [...weeks.entries()].sort()) {
    const keptPct = s.rawDishes ? ((s.kept / s.rawDishes) * 100).toFixed(0) : '–';
    const avgErr = s.portionErrN ? ((s.portionErrSum / s.portionErrN) * 100).toFixed(0) : '–';
    console.log(
      `${wk}   | ${String(s.scans).padStart(4)} | ${String(s.rawDishes).padStart(6)} | ` +
      `${String(s.kept).padStart(6)} (${keptPct}%) | ${String(s.adjusted).padStart(8)} | ` +
      `${String(s.dropped).padStart(6)} | ${String(s.manual).padStart(8)} | ${avgErr}%`,
    );
  }

  const total = [...weeks.values()].reduce((a, s) => ({
    scans: a.scans + s.scans, rawDishes: a.rawDishes + s.rawDishes, kept: a.kept + s.kept,
    adjusted: a.adjusted + s.adjusted, dropped: a.dropped + s.dropped, manual: a.manual + s.manual,
    portionErrSum: a.portionErrSum + s.portionErrSum, portionErrN: a.portionErrN + s.portionErrN,
  }), emptyWeek());

  const accuracy = total.rawDishes ? ((total.kept + total.adjusted) / total.rawDishes) * 100 : 0;
  console.log(`\nTổng: ${total.scans} scan, ${total.rawDishes} món AI nhận diện` +
    (mockSkipped ? ` (đã loại ${mockSkipped} scan mock)` : ''));
  console.log(`→ Nhận diện đúng tên (KPI accuracy): ${accuracy.toFixed(1)}%  (mục tiêu beta ≥75%)`);
  console.log(`→ Đúng tên + đúng khẩu phần (±15%): ${total.rawDishes ? ((total.kept / total.rawDishes) * 100).toFixed(1) : 0}%`);
  console.log(`→ Món user phải nhập tay/đổi tên: ${total.manual} (mỗi món là 1 lần AI bỏ sót)`);
  if (total.portionErrN) {
    console.log(`→ Sai số khẩu phần trung bình: ${((total.portionErrSum / total.portionErrN) * 100).toFixed(0)}% (SnapCalorie ~16%)`);
  }
  console.log(`→ Confidence lệch chuẩn: ${highConfidenceDropped} món AI rất tự tin (≥85%) nhưng bị user bỏ; ${lowConfidenceKept} món AI thiếu tự tin (<70%) nhưng đúng`);

  const topDrops = [...dropCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (topDrops.length) {
    console.log('\nTop món AI nhận sai nhiều nhất (ưu tiên thêm vào DB verified / few-shot prompt):');
    for (const [name, count] of topDrops) console.log(`  ${count}× ${name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
