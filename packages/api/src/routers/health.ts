import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';

const CONDITIONS = [
  'diabetes_type2',
  'hypertension',
  'gout',
  'heart_disease',
  'kidney',
  'allergy',
] as const;

export const healthRouter = router({
  listConditions: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      return ctx.prisma.healthCondition.findMany({
        where: { profileId: input.profileId },
        orderBy: { createdAt: 'asc' },
      });
    }),

  addCondition: protectedProcedure
    .input(
      z.object({
        profileId: z.string().uuid(),
        condition: z.enum(CONDITIONS),
        severity: z.enum(['mild', 'moderate', 'severe']).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      // upsert — one row per condition per profile
      return ctx.prisma.healthCondition.upsert({
        where: {
          // Prisma doesn't have a compound unique here, so do it manually
          id: (
            await ctx.prisma.healthCondition.findFirst({
              where: { profileId: input.profileId, condition: input.condition },
              select: { id: true },
            })
          )?.id ?? '00000000-0000-0000-0000-000000000000',
        },
        update: {
          severity: input.severity ?? null,
          notes: input.notes ?? null,
        },
        create: {
          profileId: input.profileId,
          condition: input.condition,
          severity: input.severity ?? null,
          notes: input.notes ?? null,
        },
      });
    }),

  removeCondition: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const row = await ctx.prisma.healthCondition.findFirst({
        where: { id: input.id },
        include: { profile: { select: { userId: true } } },
      });
      if (!row || row.profile.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await ctx.prisma.healthCondition.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
