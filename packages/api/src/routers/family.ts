import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { generateInviteCode } from '@genki/shared';

export const familyRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.profile.findFirst({
        where: { userId: ctx.userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!profile) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cần tạo hồ sơ trước' });

      const inviteCode = generateInviteCode();
      const family = await ctx.prisma.family.create({
        data: {
          ownerId: ctx.userId,
          name: input.name,
          inviteCode,
          members: {
            create: {
              profileId: profile.id,
              role: 'owner',
            },
          },
        },
        include: { members: { include: { profile: true } } },
      });

      return { family, inviteCode };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.prisma.profile.findMany({
      where: { userId: ctx.userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    return ctx.prisma.family.findMany({
      where: {
        members: { some: { profileId: { in: profileIds } } },
        isActive: true,
      },
      include: {
        members: { include: { profile: true } },
      },
    });
  }),

  getDashboard: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({
        where: { id: input.familyId },
        include: {
          members: {
            include: {
              profile: {
                include: {
                  dailySummaries: {
                    where: { summaryDate: new Date(new Date().toDateString()) },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });
      return family;
    }),

  regenerateInvite: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({ where: { id: input.familyId } });
      if (!family || family.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const inviteCode = generateInviteCode();
      await ctx.prisma.family.update({ where: { id: input.familyId }, data: { inviteCode } });
      return { inviteCode };
    }),

  join: protectedProcedure
    .input(z.object({ inviteCode: z.string().length(8), profileId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({
        where: { inviteCode: input.inviteCode.toUpperCase() },
      });
      if (!family || !family.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Mã mời không hợp lệ' });
      }

      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      const existing = await ctx.prisma.familyMember.findUnique({
        where: { familyId_profileId: { familyId: family.id, profileId: input.profileId } },
      });
      if (existing) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Đã là thành viên' });

      const member = await ctx.prisma.familyMember.create({
        data: { familyId: family.id, profileId: input.profileId, role: 'member' },
      });
      return { family, role: member.role };
    }),

  addChildProfile: protectedProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      name: z.string().min(1).max(100),
      type: z.enum(['baby', 'teen']),
      birthDate: z.string().datetime(),
      gender: z.enum(['male', 'female', 'other']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({ where: { id: input.familyId } });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });

      const profile = await ctx.prisma.profile.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          type: input.type,
          birthDate: new Date(input.birthDate),
          gender: input.gender,
          activityLevel: 2,
          uiPreferences: input.type === 'baby'
            ? { font_scale: 1.0, theme: 'pastel', simplified_mode: false }
            : { font_scale: 1.0, theme: 'vibrant', simplified_mode: false },
        },
      });

      const familyMember = await ctx.prisma.familyMember.create({
        data: { familyId: input.familyId, profileId: profile.id, role: 'child' },
      });

      return { profile, familyMember };
    }),

  updatePrivacy: protectedProcedure
    .input(z.object({
      familyMemberId: z.string().uuid(),
      privacySettings: z.object({
        showDetailsToFamily: z.boolean(),
        showMealLogs: z.boolean(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.prisma.familyMember.findUnique({
        where: { id: input.familyMemberId },
        include: { profile: true },
      });
      if (!member || member.profile.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.familyMember.update({
        where: { id: input.familyMemberId },
        data: {
          privacySettings: {
            show_details_to_family: input.privacySettings.showDetailsToFamily,
            show_meal_logs: input.privacySettings.showMealLogs,
          },
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ familyId: z.string().uuid(), profileId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({ where: { id: input.familyId } });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });

      const member = await ctx.prisma.familyMember.findUnique({
        where: { familyId_profileId: { familyId: input.familyId, profileId: input.profileId } },
        include: { profile: true },
      });
      if (!member || member.profile.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (member.role === 'owner') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Owner không thể rời nhóm, hãy chuyển quyền trước' });
      }

      await ctx.prisma.familyMember.delete({ where: { id: member.id } });
      return { success: true };
    }),
});
