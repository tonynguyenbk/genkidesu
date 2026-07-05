import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@genki/db';
import { protectedProcedure, router } from '../trpc.js';
import { analyzeFoodImageCached } from '../ai/cache.js';
import { matchFoodForDish, applyFoodMatch } from '../ai/rag.js';
import { generateHealthAlerts } from '../services/health-alerts.js';
import { assertProfileAccess } from '../utils/family-access.js';
import { uploadMealImage } from '../integrations/storage.js';
import { localDateKey, localDayRange } from '../utils/day.js';
import { recomputeDailySummary } from '../services/daily-summary.js';
import { consumeScanQuota, refundScan } from '../services/scan-quota.js';

const mealTypeSchema = z.enum([
  'breakfast', 'lunch', 'dinner',
  'snack', 'snack_morning', 'snack_afternoon', 'snack_evening', // 'snack' kept for legacy rows
  'baby_meal', 'formula',
]);

export const mealRouter = router({
  // Scan image → AI result (does NOT save yet — user must confirm)
  scan: protectedProcedure
    .input(z.object({
      imageDataUrl: z.string().min(1), // base64 data URL from client
      profileId: z.string().uuid(),
      mealType: mealTypeSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Free tier: 3 photo scans/day per account (Pro/family unlimited — all
      // accounts are free until RevenueCat lands).
      const quota = await consumeScanQuota(ctx.userId!);
      if (!quota.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Bạn đã dùng hết ${quota.limit} lượt quét ảnh hôm nay. Nâng cấp Pro để quét không giới hạn.`,
        });
      }

      const result = await analyzeFoodImageCached(ctx.prisma, input.imageDataUrl);
      // Don't charge a credit for mock responses (no AI key / AI down)
      if (result.fromMock) await refundScan(ctx.userId!);

      // RAG: match each detected dish against the verified foods table (pgvector
      // cosine similarity) and prefer verified per-100g nutrition when found.
      // Exception: values read off a visible nutrition-facts label are ground
      // truth — overriding them with a generic DB entry makes things worse
      // (e.g. coated peanut snack matched to plain roasted peanuts).
      result.dishes = await Promise.all(
        result.dishes.map(async (dish) => {
          if (dish.fromLabel) return dish;
          const match = await matchFoodForDish(ctx.prisma, dish);
          return match ? applyFoodMatch(dish, match) : dish;
        }),
      );
      result.totalCalories = result.dishes.reduce((s, d) => s + d.calories, 0);
      result.totalProteinG = result.dishes.reduce((s, d) => s + d.proteinG, 0);
      result.totalCarbsG = result.dishes.reduce((s, d) => s + d.carbsG, 0);
      result.totalFatG = result.dishes.reduce((s, d) => s + d.fatG, 0);

      const conditions = await ctx.prisma.healthCondition.findMany({
        where: { profileId: input.profileId },
        select: { condition: true },
      });
      const healthAlerts = generateHealthAlerts(result.dishes, conditions);
      if (healthAlerts.length) {
        result.alerts = [...healthAlerts, ...result.alerts];
      }

      return result;
    }),

  // Confirm scan → save meal_log + meal_items + update daily_summary
  confirmLog: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      mealType: mealTypeSchema,
      imageDataUrl: z.string().optional(),
      rawAiResult: z.unknown().optional(),
      loggedAt: z.string().datetime(),
      dishes: z.array(z.object({
        nameVi: z.string(),
        nameEn: z.string().optional(),
        portionG: z.number(),
        calories: z.number(),
        proteinG: z.number(),
        carbsG: z.number(),
        fatG: z.number(),
        foodId: z.string().uuid().optional(),
        micronutrients: z.record(z.number()).optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      const mealLog = await ctx.prisma.mealLog.create({
        data: {
          profileId: input.profileId,
          mealType: input.mealType,
          loggedAt: new Date(input.loggedAt),
          userConfirmed: true,
          aiConfidence: 0.9,
          items: {
            create: input.dishes.map((d) => ({
              foodId: d.foodId ?? null,
              foodNameOverride: d.nameVi,
              portionGrams: d.portionG,
              calories: d.calories,
              proteinG: d.proteinG,
              carbsG: d.carbsG,
              fatG: d.fatG,
              aiDetected: true,
              ...(d.micronutrients ? { micronutrients: d.micronutrients as Prisma.InputJsonValue } : {}),
            })),
          },
        },
        include: { items: true },
      });

      // Persist the source image (R2, if configured) and the raw AI result for
      // audit/debugging — no-op if imageDataUrl/rawAiResult weren't provided.
      if (input.imageDataUrl || input.rawAiResult !== undefined) {
        const imageUrl = input.imageDataUrl
          ? await uploadMealImage(input.imageDataUrl, mealLog.id)
          : null;

        if (imageUrl || input.rawAiResult !== undefined) {
          await ctx.prisma.mealLog.update({
            where: { id: mealLog.id },
            data: {
              ...(imageUrl ? { imageUrl } : {}),
              ...(input.rawAiResult !== undefined
                ? { aiRawResult: input.rawAiResult as Prisma.InputJsonValue }
                : {}),
            },
          });
        }
      }

      // Recompute the day's summary from scratch so it stays correct after
      // later edits/deletes (no increment drift).
      await recomputeDailySummary(ctx.prisma, input.profileId, new Date(input.loggedAt));

      return mealLog;
    }),

  // Delete a whole meal entry (all its items) and refresh the daily summary
  deleteLog: protectedProcedure
    .input(z.object({ mealLogId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const log = await ctx.prisma.mealLog.findUnique({
        where: { id: input.mealLogId },
        include: { profile: { select: { userId: true } } },
      });
      if (!log || log.profile.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });

      await ctx.prisma.mealLog.delete({ where: { id: input.mealLogId } });
      await recomputeDailySummary(ctx.prisma, log.profileId, log.loggedAt);
      return { success: true };
    }),

  // Delete a single dish from a meal. If it was the last dish, the empty meal
  // log is removed too so it doesn't linger as a ghost entry.
  deleteItem: protectedProcedure
    .input(z.object({ mealItemId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.mealItem.findUnique({
        where: { id: input.mealItemId },
        include: { mealLog: { include: { profile: { select: { userId: true } } } } },
      });
      if (!item || item.mealLog.profile.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });

      await ctx.prisma.mealItem.delete({ where: { id: input.mealItemId } });
      const remaining = await ctx.prisma.mealItem.count({ where: { mealLogId: item.mealLogId } });
      if (remaining === 0) {
        await ctx.prisma.mealLog.delete({ where: { id: item.mealLogId } });
      }
      await recomputeDailySummary(ctx.prisma, item.mealLog.profileId, item.mealLog.loggedAt);
      return { success: true };
    }),

  // Change a dish's portion — macros scale proportionally from the stored values.
  updateItemPortion: protectedProcedure
    .input(z.object({ mealItemId: z.string().uuid(), portionGrams: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.mealItem.findUnique({
        where: { id: input.mealItemId },
        include: { mealLog: { include: { profile: { select: { userId: true } } } } },
      });
      if (!item || item.mealLog.profile.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });

      const ratio = item.portionGrams > 0 ? input.portionGrams / item.portionGrams : 1;

      // Scale micronutrients proportionally too, if present.
      const micros = item.micronutrients as Record<string, unknown> | null;
      let scaledMicros: Record<string, number> | undefined;
      if (micros && typeof micros === 'object') {
        scaledMicros = {};
        for (const [k, v] of Object.entries(micros)) {
          if (typeof v === 'number') scaledMicros[k] = parseFloat((v * ratio).toFixed(2));
        }
      }

      await ctx.prisma.mealItem.update({
        where: { id: input.mealItemId },
        data: {
          portionGrams: input.portionGrams,
          calories: Math.round(item.calories * ratio),
          proteinG: parseFloat((item.proteinG * ratio).toFixed(1)),
          carbsG: parseFloat((item.carbsG * ratio).toFixed(1)),
          fatG: parseFloat((item.fatG * ratio).toFixed(1)),
          ...(scaledMicros ? { micronutrients: scaledMicros as Prisma.InputJsonValue } : {}),
        },
      });
      await recomputeDailySummary(ctx.prisma, item.mealLog.profileId, item.mealLog.loggedAt);
      return { success: true };
    }),

  // Get today's meal logs for a profile
  getDailyLogs: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      date: z.string().datetime().optional(),
    }))
    .query(async ({ input, ctx }) => {
      await assertProfileAccess(ctx.prisma, ctx.userId, input.profileId);

      const date = input.date ? new Date(input.date) : new Date();
      const { start, end } = localDayRange(date);

      const logs = await ctx.prisma.mealLog.findMany({
        where: { profileId: input.profileId, loggedAt: { gte: start, lte: end } },
        include: { items: { include: { food: true } } },
        orderBy: { loggedAt: 'asc' },
      });

      // Attach each item's micronutrient verification status (new column, read
      // raw to avoid depending on a regenerated client).
      const foodIds = [...new Set(
        logs.flatMap((l) => l.items.map((i) => i.foodId).filter((id): id is string => !!id)),
      )];
      const verifiedRows = foodIds.length
        ? await ctx.prisma.$queryRaw<{ id: string; v: boolean }[]>`
            SELECT id::text AS id, micronutrients_verified AS v
            FROM foods WHERE id::text IN (${Prisma.join(foodIds)})`
        : [];
      const verifiedMap = new Map(verifiedRows.map((r) => [r.id, r.v]));

      return logs.map((l) => ({
        ...l,
        items: l.items.map((i) => ({
          ...i,
          microVerified: i.foodId ? (verifiedMap.get(i.foodId) ?? false) : false,
        })),
      }));
    }),

  // Get daily summaries for a date range (for weekly charts)
  getWeeklySummaries: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      from: z.string().datetime(),
      to: z.string().datetime(),
    }))
    .query(async ({ input, ctx }) => {
      await assertProfileAccess(ctx.prisma, ctx.userId, input.profileId);

      const from = localDateKey(new Date(input.from));
      const to = localDateKey(new Date(input.to));

      return ctx.prisma.dailySummary.findMany({
        where: { profileId: input.profileId, summaryDate: { gte: from, lte: to } },
        orderBy: { summaryDate: 'asc' },
      });
    }),

  // Get daily summary
  getDailySummary: protectedProcedure
    .input(z.object({ profileId: z.string().uuid(), date: z.string().datetime().optional() }))
    .query(async ({ input, ctx }) => {
      const date = input.date ? new Date(input.date) : new Date();
      return ctx.prisma.dailySummary.findUnique({
        where: { profileId_summaryDate: { profileId: input.profileId, summaryDate: localDateKey(date) } },
      });
    }),
});
