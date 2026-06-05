import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { analyzeFoodImage } from '../ai/vision.js';

const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'baby_meal', 'formula']);

export const mealRouter = router({
  // Scan image → AI result (does NOT save yet — user must confirm)
  scan: protectedProcedure
    .input(z.object({
      imageDataUrl: z.string().min(1), // base64 data URL from client
      profileId: z.string().uuid(),
      mealType: mealTypeSchema,
    }))
    .mutation(async ({ input }) => {
      const result = await analyzeFoodImage(input.imageDataUrl);
      return result;
    }),

  // Confirm scan → save meal_log + meal_items + update daily_summary
  confirmLog: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      mealType: mealTypeSchema,
      imageDataUrl: z.string().optional(),
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
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      const totalCals = input.dishes.reduce((s, d) => s + d.calories, 0);
      const totalProtein = input.dishes.reduce((s, d) => s + d.proteinG, 0);
      const totalCarbs = input.dishes.reduce((s, d) => s + d.carbsG, 0);
      const totalFat = input.dishes.reduce((s, d) => s + d.fatG, 0);

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
            })),
          },
        },
        include: { items: true },
      });

      // Upsert daily summary
      const today = new Date(input.loggedAt);
      today.setHours(0, 0, 0, 0);

      await ctx.prisma.dailySummary.upsert({
        where: { profileId_summaryDate: { profileId: input.profileId, summaryDate: today } },
        update: {
          totalCalories: { increment: totalCals },
          totalProteinG: { increment: totalProtein },
          totalCarbsG: { increment: totalCarbs },
          totalFatG: { increment: totalFat },
          mealCount: { increment: 1 },
          netCalories: { increment: totalCals },
        },
        create: {
          profileId: input.profileId,
          summaryDate: today,
          totalCalories: totalCals,
          totalProteinG: totalProtein,
          totalCarbsG: totalCarbs,
          totalFatG: totalFat,
          mealCount: 1,
          netCalories: totalCals,
        },
      });

      return mealLog;
    }),

  // Get today's meal logs for a profile
  getDailyLogs: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      date: z.string().datetime().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      const date = input.date ? new Date(input.date) : new Date();
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      return ctx.prisma.mealLog.findMany({
        where: { profileId: input.profileId, loggedAt: { gte: start, lte: end } },
        include: { items: { include: { food: true } } },
        orderBy: { loggedAt: 'asc' },
      });
    }),

  // Get daily summary
  getDailySummary: protectedProcedure
    .input(z.object({ profileId: z.string().uuid(), date: z.string().datetime().optional() }))
    .query(async ({ input, ctx }) => {
      const date = input.date ? new Date(input.date) : new Date();
      date.setHours(0, 0, 0, 0);
      return ctx.prisma.dailySummary.findUnique({
        where: { profileId_summaryDate: { profileId: input.profileId, summaryDate: date } },
      });
    }),
});
