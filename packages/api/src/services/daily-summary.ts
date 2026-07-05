import { localDateKey, localDayRange } from '../utils/day.js';

type PrismaInstance = typeof import('@genki/db').prisma;

// Rebuilds a profile's daily_summary for the app-timezone day containing `date`
// by summing all of that day's meal_items. Called after any create/edit/delete/
// sync so the aggregate can never drift out of sync with the underlying logs.
export async function recomputeDailySummary(
  prisma: PrismaInstance,
  profileId: string,
  date: Date,
): Promise<void> {
  const { start, end } = localDayRange(date);
  const summaryDate = localDateKey(date);

  const logs = await prisma.mealLog.findMany({
    where: { profileId, loggedAt: { gte: start, lte: end } },
    include: { items: true },
  });

  const totals = logs.reduce(
    (acc, log) => {
      for (const it of log.items) {
        acc.cal += it.calories;
        acc.p += it.proteinG;
        acc.c += it.carbsG;
        acc.f += it.fatG;
      }
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  await prisma.dailySummary.upsert({
    where: { profileId_summaryDate: { profileId, summaryDate } },
    update: {
      totalCalories: totals.cal,
      totalProteinG: totals.p,
      totalCarbsG: totals.c,
      totalFatG: totals.f,
      mealCount: logs.length,
      netCalories: totals.cal,
    },
    create: {
      profileId,
      summaryDate,
      totalCalories: totals.cal,
      totalProteinG: totals.p,
      totalCarbsG: totals.c,
      totalFatG: totals.f,
      mealCount: logs.length,
      netCalories: totals.cal,
    },
  });
}
