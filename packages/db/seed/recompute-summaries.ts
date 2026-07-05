import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirror packages/api/src/utils/day.ts — app timezone is Vietnam (UTC+7).
const OFFSET_MS = Number(process.env['APP_TZ_OFFSET_MINUTES'] ?? 420) * 60 * 1000;

// VN calendar date (YYYY-MM-DD) of a UTC instant.
function localDateStr(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

// Rebuilds every daily_summary from meal_logs, grouping by the VN calendar day so
// summary_date matches what the API now reads. Wipes the old (timezone-skewed)
// summaries first.
async function main() {
  const logs = await prisma.mealLog.findMany({ include: { items: true } });

  const acc = new Map<string, { cal: number; p: number; c: number; f: number; count: number }>();
  for (const log of logs) {
    const key = `${log.profileId}|${localDateStr(log.loggedAt)}`;
    const t = acc.get(key) ?? { cal: 0, p: 0, c: 0, f: 0, count: 0 };
    for (const it of log.items) {
      t.cal += it.calories; t.p += it.proteinG; t.c += it.carbsG; t.f += it.fatG;
    }
    t.count += 1;
    acc.set(key, t);
  }

  const rows = [...acc.entries()].map(([key, t]) => {
    const [profileId, dateStr] = key.split('|');
    return {
      profileId: profileId!,
      summaryDate: new Date(`${dateStr}T00:00:00.000Z`),
      totalCalories: t.cal,
      totalProteinG: t.p,
      totalCarbsG: t.c,
      totalFatG: t.f,
      mealCount: t.count,
      netCalories: t.cal,
    };
  });

  await prisma.dailySummary.deleteMany({});
  if (rows.length) await prisma.dailySummary.createMany({ data: rows });

  console.log(`Recomputed ${rows.length} daily summaries from ${logs.length} logs (VN timezone)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
