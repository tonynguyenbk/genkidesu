import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { calculateTDEE, getDefaultNutritionTargets, getDefaultUiPreferences } from '../services/tdee.js';

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
        uiPreferences: getDefaultUiPreferences(input.type),
      };

      const tempProfile = {
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        gender: input.gender ?? null,
        activityLevel: input.activityLevel ?? 2,
      };

      const tdee = calculateTDEE(tempProfile);
      const nutritionTargets = getDefaultNutritionTargets(input.type, tdee);

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
            data: { tdeeKcal: tdee, nutritionTargets: getDefaultNutritionTargets(updated.type, tdee) },
          });
        }
      }

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.id, userId: ctx.userId, isActive: true },
      });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      return profile;
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
});
