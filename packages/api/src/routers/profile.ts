import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { assessGrowth, getAgeMonthsFromBirthDate } from '@genki/shared';
import { protectedProcedure, router } from '../trpc.js';
import { calculateTDEE, getDefaultNutritionTargets, getDefaultUiPreferences } from '../services/tdee.js';
import { assertProfileAccess } from '../utils/family-access.js';

const MAX_PROFILES = 10;

export const profileRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['adult', 'baby', 'teen', 'senior']),
      birthDate: z.string().datetime().optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
      heightCm: z.number().min(30).max(250).optional(),
      weightKg: z.number().min(1).max(300).optional(),
      activityLevel: z.number().int().min(1).max(5).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const count = await ctx.prisma.profile.count({ where: { userId: ctx.userId } });
      if (count >= MAX_PROFILES) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Tối đa ${MAX_PROFILES} hồ sơ` });
      }

      const profileData = {
        userId: ctx.userId,
        name: input.name,
        type: input.type,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        gender: input.gender,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        activityLevel: input.activityLevel ?? 2,
        uiPreferences: getDefaultUiPreferences(input.type, input.birthDate),
      };

      const tempProfile = {
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        gender: input.gender ?? null,
        activityLevel: input.activityLevel ?? 2,
      };

      const tdee = calculateTDEE(tempProfile);
      const nutritionTargets = getDefaultNutritionTargets(input.type, tdee, input.birthDate);

      const profile = await ctx.prisma.profile.create({
        data: { ...profileData, tdeeKcal: tdee, nutritionTargets },
      });

      return profile;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.profile.findMany({
      where: { userId: ctx.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      heightCm: z.number().min(30).max(250).optional(),
      weightKg: z.number().min(1).max(300).optional(),
      activityLevel: z.number().int().min(1).max(5).optional(),
      uiPreferences: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.profile.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

      const { id, uiPreferences, ...updateFields } = input;
      const updated = await ctx.prisma.profile.update({
        where: { id },
        data: {
          ...updateFields,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(uiPreferences ? { uiPreferences: uiPreferences as any } : {}),
        },
      });

      if (input.heightCm || input.weightKg || input.activityLevel) {
        const tdee = calculateTDEE(updated);
        if (tdee) {
          return ctx.prisma.profile.update({
            where: { id },
            data: { tdeeKcal: tdee, nutritionTargets: getDefaultNutritionTargets(updated.type, tdee, updated.birthDate) },
          });
        }
      }

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return assertProfileAccess(ctx.prisma, ctx.userId, input.id);
    }),

  calculateTDEE: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      const tdee = calculateTDEE(profile);
      return { tdee, profile };
    }),

  // Ghi nhận số đo tăng trưởng (chiều cao/cân nặng) — dùng cho hồ sơ em bé
  addGrowthMeasurement: protectedProcedure
    .input(z.object({
      profileId: z.string().uuid(),
      measuredAt: z.string().datetime(),
      heightCm: z.number().min(20).max(150).optional(),
      weightKg: z.number().min(0.5).max(60).optional(),
      headCircumferenceCm: z.number().min(20).max(70).optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!profile.birthDate) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Hồ sơ chưa có ngày sinh — không thể tính tuổi' });
      }
      if (!input.heightCm && !input.weightKg && !input.headCircumferenceCm) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cần nhập ít nhất 1 chỉ số' });
      }

      const measuredAt = new Date(input.measuredAt);
      const ageMonths = getAgeMonthsFromBirthDate(new Date(profile.birthDate), measuredAt);

      const measurement = await ctx.prisma.growthMeasurement.create({
        data: {
          profileId: input.profileId,
          measuredAt,
          ageMonths,
          heightCm: input.heightCm,
          weightKg: input.weightKg,
          headCircumferenceCm: input.headCircumferenceCm,
          notes: input.notes,
        },
      });

      // Đồng bộ chiều cao/cân nặng mới nhất vào hồ sơ
      if (input.heightCm || input.weightKg) {
        await ctx.prisma.profile.update({
          where: { id: input.profileId },
          data: {
            ...(input.heightCm ? { heightCm: input.heightCm } : {}),
            ...(input.weightKg ? { weightKg: input.weightKg } : {}),
          },
        });
      }

      return measurement;
    }),

  // Lịch sử tăng trưởng + đánh giá z-score theo chuẩn WHO (0-24 tháng)
  getGrowthHistory: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });

      const measurements = await ctx.prisma.growthMeasurement.findMany({
        where: { profileId: input.profileId },
        orderBy: { measuredAt: 'asc' },
      });

      const gender = profile.gender ?? 'male';
      const records = measurements.map((m) => ({
        ...m,
        weightAssessment:
          m.weightKg != null ? assessGrowth('weight', gender, m.ageMonths, m.weightKg) : null,
        heightAssessment:
          m.heightCm != null ? assessGrowth('height', gender, m.ageMonths, m.heightCm) : null,
      }));

      return {
        gender,
        birthDate: profile.birthDate,
        records,
        latest: records.at(-1) ?? null,
      };
    }),
});
