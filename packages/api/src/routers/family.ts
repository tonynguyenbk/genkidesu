import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@genki/db';
import { protectedProcedure, router } from '../trpc.js';
import { generateInviteCode } from '@genki/shared';
import { localDateKey, localDayRange } from '../utils/day.js';
import { computeMemberStatus, statusRank } from '../services/alert-flags.js';
import { recomputeDailySummary } from '../services/daily-summary.js';

// Scales a meal item's micronutrient map by a portion ratio (skips non-numbers).
function scaleMicros(micros: Prisma.JsonValue, ratio: number): Prisma.InputJsonValue | undefined {
  if (!micros || typeof micros !== 'object' || Array.isArray(micros)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(micros)) {
    if (typeof v === 'number') out[k] = parseFloat((v * ratio).toFixed(2));
  }
  return Object.keys(out).length ? out : undefined;
}

// Template defaults per group type. Family: small, high-trust (details visible).
// Community: large, privacy-first (only streaks/aggregates visible by default).
const GROUP_TEMPLATES = {
  family: { maxMembers: 10, defaultPrivacy: { show_details_to_family: true, show_meal_logs: true } },
  community: { maxMembers: 500, defaultPrivacy: { show_details_to_family: false, show_meal_logs: false } },
} as const;

export const familyRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['family', 'community']).default('family'),
      // Which of the caller's profiles join at creation. Defaults to the
      // caller's oldest profile. Communities always start with exactly one.
      profileIds: z.array(z.string().uuid()).max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (myProfiles.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cần tạo hồ sơ trước' });
      }

      const myIds = new Set(myProfiles.map((p) => p.id));
      let joinIds = (input.profileIds ?? [myProfiles[0]!.id]).filter((id) => myIds.has(id));
      if (joinIds.length === 0) joinIds = [myProfiles[0]!.id];
      if (input.type === 'community') joinIds = joinIds.slice(0, 1);

      const template = GROUP_TEMPLATES[input.type];
      const byId = new Map(myProfiles.map((p) => [p.id, p]));
      const inviteCode = generateInviteCode();
      const family = await ctx.prisma.family.create({
        data: {
          ownerId: ctx.userId,
          name: input.name,
          type: input.type,
          maxMembers: template.maxMembers,
          inviteCode,
          members: {
            create: joinIds.map((profileId, i) => ({
              profileId,
              // First profile is the owner; dependents (baby/teen) join as child
              role: i === 0 ? ('owner' as const)
                : ['baby', 'teen'].includes(byId.get(profileId)?.type ?? '') ? ('child' as const)
                : ('member' as const),
            })),
          },
        },
        include: { members: { include: { profile: true } } },
      });

      return { family, inviteCode };
    }),

  // Group info by invite code — lets the join screen show what the user is
  // about to join (and pick profiles accordingly) before committing.
  preview: protectedProcedure
    .input(z.object({ inviteCode: z.string().length(8) }))
    .query(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({
        where: { inviteCode: input.inviteCode.toUpperCase() },
        include: { _count: { select: { members: true } } },
      });
      if (!family || !family.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Mã mời không hợp lệ' });
      }
      return {
        id: family.id,
        name: family.name,
        type: family.type as 'family' | 'community',
        memberCount: family._count.members,
        maxMembers: family.maxMembers,
      };
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
      const today = localDateKey(new Date());
      const { start: dayStart } = localDayRange(new Date());
      const family = await ctx.prisma.family.findUnique({
        where: { id: input.familyId },
        include: {
          members: {
            include: {
              profile: {
                include: {
                  dailySummaries: {
                    where: { summaryDate: today },
                    take: 1,
                  },
                  mealLogs: {
                    where: {
                      loggedAt: { gte: dayStart },
                      userConfirmed: true,
                    },
                    select: { id: true, mealType: true, loggedAt: true },
                    orderBy: { loggedAt: 'asc' },
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

  getAlerts: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const today = localDateKey(new Date());
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

      const family = await ctx.prisma.family.findUnique({
        where: { id: input.familyId },
        include: {
          members: {
            include: {
              profile: {
                include: {
                  dailySummaries: {
                    where: { summaryDate: { gte: threeDaysAgo } },
                    orderBy: { summaryDate: 'desc' },
                    take: 3,
                  },
                },
              },
            },
          },
        },
      });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });

      const alerts: Array<{
        profileId: string;
        profileName: string;
        type: string;
        message: string;
        severity: 'info' | 'warning' | 'danger';
      }> = [];

      for (const member of family.members) {
        const { profile, privacySettings } = member;
        const privacy = privacySettings as Record<string, unknown>;
        if (privacy?.show_details_to_family === false) continue;

        const todayUtc = today.toISOString().slice(0, 10);
        const todaySummary = profile.dailySummaries.find(
          (s) => s.summaryDate.toISOString().slice(0, 10) === todayUtc,
        );
        const calorieGoal =
          (profile.nutritionTargets as Record<string, number> | null)?.calories ??
          profile.tdeeKcal ?? 1800;
        const proteinGoal =
          (profile.nutritionTargets as Record<string, number> | null)?.protein_g ?? 60;

        // No meals logged today
        if (!todaySummary || todaySummary.mealCount === 0) {
          alerts.push({
            profileId: profile.id,
            profileName: profile.name,
            type: 'missing_meals',
            message: `${profile.name} chưa ghi nhận bữa ăn nào hôm nay`,
            severity: 'warning',
          });
          continue;
        }

        // Below 50% calorie goal
        if (todaySummary.totalCalories < calorieGoal * 0.5) {
          alerts.push({
            profileId: profile.id,
            profileName: profile.name,
            type: 'low_calories',
            message: `${profile.name} mới đạt ${Math.round((todaySummary.totalCalories / calorieGoal) * 100)}% mục tiêu calo`,
            severity: 'warning',
          });
        }

        // Low protein
        if (todaySummary.totalProteinG < proteinGoal * 0.6) {
          alerts.push({
            profileId: profile.id,
            profileName: profile.name,
            type: 'low_protein',
            message: `${profile.name} thiếu protein hôm nay (${Math.round(todaySummary.totalProteinG)}g/${Math.round(proteinGoal)}g)`,
            severity: 'info',
          });
        }

        // 3-day streak low calories
        const allLow = profile.dailySummaries
          .slice(0, 3)
          .every((s) => s.totalCalories < calorieGoal * 0.7);
        if (profile.dailySummaries.length === 3 && allLow) {
          alerts.push({
            profileId: profile.id,
            profileName: profile.name,
            type: 'streak_low',
            message: `${profile.name} ăn dưới mục tiêu 3 ngày liên tiếp`,
            severity: 'danger',
          });
        }

        // Great day (90-110% of goal)
        if (
          todaySummary.totalCalories >= calorieGoal * 0.9 &&
          todaySummary.totalCalories <= calorieGoal * 1.1
        ) {
          alerts.push({
            profileId: profile.id,
            profileName: profile.name,
            type: 'great_day',
            message: `${profile.name} đạt mục tiêu dinh dưỡng hôm nay! 🎉`,
            severity: 'info',
          });
        }
      }

      return { alerts };
    }),

  // Group dashboard — per-member nutrition status for the day. Leader (owner)
  // sees every member; a plain member sees only their own profiles. status +
  // alertFlags are computed server-side (see services/alert-flags.ts).
  groupDashboard: protectedProcedure
    .input(z.object({ familyId: z.string().uuid(), date: z.string().datetime().optional() }))
    .query(async ({ input, ctx }) => {
      const date = input.date ? new Date(input.date) : new Date();
      const { start, end } = localDayRange(date);

      const family = await ctx.prisma.family.findUnique({
        where: { id: input.familyId },
        include: {
          members: {
            include: {
              profile: {
                include: {
                  mealLogs: {
                    where: { loggedAt: { gte: start, lte: end }, userConfirmed: true },
                    include: { items: true },
                    orderBy: { loggedAt: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });

      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      const myIds = new Set(myProfiles.map((p) => p.id));
      const callerIsLeader = family.members.some((m) => myIds.has(m.profileId) && m.role === 'owner');

      // Visible = (leader: everyone, member: own profiles), minus members who hid
      // details from the group (unless it's the caller's own profile).
      const visible = (callerIsLeader ? family.members : family.members.filter((m) => myIds.has(m.profileId)))
        .filter((m) => myIds.has(m.profileId) ||
          (m.privacySettings as Record<string, unknown>)?.show_details_to_family !== false);

      const members = visible.map((m) => {
        const p = m.profile;
        const targets = (p.nutritionTargets as Record<string, number> | null) ?? {};
        const targetKcal = targets.calories ?? p.tdeeKcal ?? 1800;
        const targetProtein = targets.protein_g ?? 60;

        const items = p.mealLogs.flatMap((l) => l.items);
        const actualKcal = Math.round(items.reduce((s, i) => s + i.calories, 0));
        const proteinG = items.reduce((s, i) => s + i.proteinG, 0);
        const carbG = items.reduce((s, i) => s + i.carbsG, 0);
        const fatG = items.reduce((s, i) => s + i.fatG, 0);

        const { status, progressPct, alertFlags } = computeMemberStatus({
          targetKcal,
          actualKcal,
          proteinG,
          targetProteinG: targetProtein,
          mealTypes: p.mealLogs.map((l) => l.mealType),
        });

        return {
          profileId: p.id,
          displayName: p.name,
          avatarUrl: p.avatarUrl,
          type: p.type,
          role: m.role === 'owner' ? ('leader' as const) : ('member' as const),
          targetKcal,
          actualKcal,
          progressPct,
          status,
          alertFlags,
          macros: { proteinG: Math.round(proteinG), carbG: Math.round(carbG), fatG: Math.round(fatG) },
          meals: p.mealLogs.map((l) => ({
            id: l.id,
            name: l.items[0]?.foodNameOverride ?? 'Bữa ăn',
            kcal: Math.round(l.items.reduce((s, i) => s + i.calories, 0)),
            loggedAt: l.loggedAt,
            source: l.syncEventId ? ('meal_sync' as const) : ('self' as const),
          })),
        };
      });

      members.sort((a, b) => statusRank(a.status) - statusRank(b.status));

      return {
        group: { id: family.id, name: family.name, memberCount: family.members.length },
        summary: {
          totalKcal: members.reduce((s, m) => s + m.actualKcal, 0),
          membersOnTarget: members.filter((m) => m.status === 'ok').length,
          totalMeals: visible.reduce((s, m) => s + m.profile.mealLogs.length, 0),
        },
        members,
        callerIsLeader,
      };
    }),

  // Meal-sync conflict check: which selected profiles already logged a meal
  // within ±windowMinutes of the proposed meal time.
  conflictCheck: protectedProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      profileIds: z.array(z.string().uuid()),
      mealTime: z.string().datetime(),
      windowMinutes: z.number().min(1).max(180).default(30),
    }))
    .query(async ({ input, ctx }) => {
      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      const callerMember = await ctx.prisma.familyMember.findFirst({
        where: { familyId: input.familyId, profileId: { in: myProfiles.map((p) => p.id) } },
      });
      if (!callerMember) throw new TRPCError({ code: 'FORBIDDEN' });
      if (input.profileIds.length === 0) return { conflicts: [] };

      const t = new Date(input.mealTime).getTime();
      const conflicts = await ctx.prisma.mealLog.findMany({
        where: {
          profileId: { in: input.profileIds },
          userConfirmed: true,
          loggedAt: {
            gte: new Date(t - input.windowMinutes * 60_000),
            lte: new Date(t + input.windowMinutes * 60_000),
          },
        },
        select: { id: true, profileId: true, loggedAt: true, items: { select: { foodNameOverride: true }, take: 1 } },
      });

      return {
        conflicts: conflicts.map((c) => ({
          profileId: c.profileId,
          conflictingMealLogId: c.id,
          loggedAt: c.loggedAt,
          name: c.items[0]?.foodNameOverride ?? 'Bữa ăn',
        })),
      };
    }),

  // Fan a logged meal out to chosen members' profiles, scaled per portion ratio.
  // Stores portion_ratio (not absolute kcal) so totals recompute if the source
  // meal's estimate is later corrected.
  mealSync: protectedProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      mealLogId: z.string().uuid(),
      members: z.array(z.object({
        profileId: z.string().uuid(),
        portionRatio: z.number().min(0.1).max(5),
      })).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const source = await ctx.prisma.mealLog.findUnique({
        where: { id: input.mealLogId },
        include: { items: true, profile: { select: { userId: true } } },
      });
      if (!source || source.profile.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      // Don't sync a meal that is itself a synced copy (avoid sync chains/loops).
      if (source.syncEventId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bữa này đã là bản đồng bộ, không thể đồng bộ tiếp' });
      }

      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      const callerMember = await ctx.prisma.familyMember.findFirst({
        where: { familyId: input.familyId, profileId: { in: myProfiles.map((p) => p.id) } },
      });
      if (!callerMember) throw new TRPCError({ code: 'FORBIDDEN' });

      const familyMembers = await ctx.prisma.familyMember.findMany({
        where: { familyId: input.familyId },
        select: { profileId: true },
      });
      const memberSet = new Set(familyMembers.map((m) => m.profileId));

      // Idempotency: skip members who already received THIS source meal (prevents
      // double-counting if the sheet is submitted twice or two people both sync).
      const priorEvents = await ctx.prisma.mealSyncEvent.findMany({
        where: { sourceMealLogId: source.id },
        select: { id: true },
      });
      const priorMembers = priorEvents.length
        ? await ctx.prisma.mealSyncMember.findMany({
            where: { syncEventId: { in: priorEvents.map((e) => e.id) } },
            select: { profileId: true },
          })
        : [];
      const alreadySynced = new Set(priorMembers.map((m) => m.profileId));

      const requested = input.members.filter((m) => m.profileId !== source.profileId && memberSet.has(m.profileId));
      const targets = requested.filter((m) => !alreadySynced.has(m.profileId));
      const skipped = requested.filter((m) => alreadySynced.has(m.profileId)).map((m) => m.profileId);
      if (targets.length === 0) {
        if (skipped.length > 0) {
          return { syncEventId: null, syncedCount: 0, membersUpdated: [], skipped };
        }
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Không có thành viên hợp lệ để đồng bộ' });
      }

      const sourceKcal = source.items.reduce((s, i) => s + i.calories, 0);
      const event = await ctx.prisma.mealSyncEvent.create({
        data: { sourceMealLogId: source.id, syncedById: source.profileId, familyId: input.familyId },
      });

      const updated: string[] = [];
      for (const target of targets) {
        const ratio = target.portionRatio;
        await ctx.prisma.mealLog.create({
          data: {
            profileId: target.profileId,
            mealType: source.mealType,
            loggedAt: source.loggedAt,
            userConfirmed: true,
            aiConfidence: source.aiConfidence,
            imageUrl: source.imageUrl,
            syncEventId: event.id,
            items: {
              create: source.items.map((it) => ({
                foodId: it.foodId,
                foodNameOverride: it.foodNameOverride,
                portionGrams: parseFloat((it.portionGrams * ratio).toFixed(1)),
                calories: Math.round(it.calories * ratio),
                proteinG: parseFloat((it.proteinG * ratio).toFixed(1)),
                carbsG: parseFloat((it.carbsG * ratio).toFixed(1)),
                fatG: parseFloat((it.fatG * ratio).toFixed(1)),
                ...(scaleMicros(it.micronutrients, ratio)
                  ? { micronutrients: scaleMicros(it.micronutrients, ratio) }
                  : {}),
                aiDetected: it.aiDetected,
              })),
            },
          },
        });
        await ctx.prisma.mealSyncMember.create({
          data: {
            syncEventId: event.id,
            profileId: target.profileId,
            portionRatio: ratio,
            kcalSnapshot: Math.round(sourceKcal * ratio),
          },
        });
        await recomputeDailySummary(ctx.prisma, target.profileId, source.loggedAt);
        updated.push(target.profileId);
      }

      return { syncEventId: event.id as string | null, syncedCount: updated.length, membersUpdated: updated, skipped };
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
    .input(z.object({
      inviteCode: z.string().length(8),
      // Family: any of the caller's profiles can join together (vào cả nhà).
      // Community: exactly one profile per join.
      profileIds: z.array(z.string().uuid()).min(1).max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({
        where: { inviteCode: input.inviteCode.toUpperCase() },
        include: { _count: { select: { members: true } } },
      });
      if (!family || !family.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Mã mời không hợp lệ' });
      }
      if (family.type === 'community' && input.profileIds.length > 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cộng đồng chỉ tham gia bằng 1 hồ sơ' });
      }

      const profiles = await ctx.prisma.profile.findMany({
        where: { id: { in: input.profileIds }, userId: ctx.userId },
      });
      if (profiles.length !== input.profileIds.length) throw new TRPCError({ code: 'FORBIDDEN' });

      const existing = await ctx.prisma.familyMember.findMany({
        where: { familyId: family.id, profileId: { in: input.profileIds } },
        select: { profileId: true },
      });
      const existingIds = new Set(existing.map((m) => m.profileId));
      const toJoin = profiles.filter((p) => !existingIds.has(p.id));
      if (toJoin.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Đã là thành viên' });

      if (family._count.members + toJoin.length > family.maxMembers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nhóm đã đầy' });
      }

      const template = GROUP_TEMPLATES[(family.type as 'family' | 'community') ?? 'family'];
      await ctx.prisma.familyMember.createMany({
        data: toJoin.map((p) => ({
          familyId: family.id,
          profileId: p.id,
          role: ['baby', 'teen'].includes(p.type) ? ('child' as const) : ('member' as const),
          privacySettings: template.defaultPrivacy,
        })),
      });
      return { family, joinedCount: toJoin.length };
    }),

  // Community leaderboard — effort-based ranking only (streaks & goal-days),
  // never raw calories/weight: avoids leaking sensitive health data and
  // doesn't reward under-eating. Streak = consecutive days (ending today or
  // yesterday) with at least one confirmed meal log.
  leaderboard: protectedProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const family = await ctx.prisma.family.findUnique({
        where: { id: input.familyId },
        include: { members: { include: { profile: true } } },
      });
      if (!family) throw new TRPCError({ code: 'NOT_FOUND' });

      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      const myIds = new Set(myProfiles.map((p) => p.id));
      if (!family.members.some((m) => myIds.has(m.profileId))) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const today = localDateKey(new Date());
      const windowStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

      const profileIds = family.members.map((m) => m.profileId);
      const summaries = await ctx.prisma.dailySummary.findMany({
        where: {
          profileId: { in: profileIds },
          summaryDate: { gte: windowStart },
          mealCount: { gt: 0 },
        },
        select: { profileId: true, summaryDate: true, totalCalories: true, mealCount: true },
      });

      const byProfile = new Map<string, typeof summaries>();
      for (const s of summaries) {
        const arr = byProfile.get(s.profileId) ?? [];
        arr.push(s);
        byProfile.set(s.profileId, arr);
      }

      const DAY = 24 * 60 * 60 * 1000;
      const rows = family.members.map((m) => {
        const p = m.profile;
        const mine = byProfile.get(m.profileId) ?? [];
        const loggedDays = new Set(mine.map((s) => s.summaryDate.getTime()));

        // Streak may end today or yesterday (today isn't over yet)
        let cursor = loggedDays.has(today.getTime()) ? today.getTime() : today.getTime() - DAY;
        let streak = 0;
        while (loggedDays.has(cursor)) { streak += 1; cursor -= DAY; }

        const targets = (p.nutritionTargets as Record<string, number> | null) ?? {};
        const goal = targets.calories ?? p.tdeeKcal ?? 1800;
        const week = mine.filter((s) => s.summaryDate.getTime() >= weekStart.getTime());
        const onTargetDays = week.filter(
          (s) => s.totalCalories >= goal * 0.9 && s.totalCalories <= goal * 1.1,
        ).length;

        return {
          profileId: p.id,
          displayName: p.name,
          avatarUrl: p.avatarUrl,
          isMe: myIds.has(p.id),
          role: m.role === 'owner' ? ('leader' as const) : ('member' as const),
          streak,
          logDays7: week.length,
          onTargetDays7: onTargetDays,
        };
      });

      rows.sort((a, b) => b.streak - a.streak || b.onTargetDays7 - a.onTargetDays7 || b.logDays7 - a.logDays7);

      return {
        group: { id: family.id, name: family.name, type: family.type, memberCount: family.members.length },
        entries: rows.map((r, i) => ({ ...r, rank: i + 1 })),
      };
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

  // FamilyMember row for one of the caller's own profiles — powers the
  // privacy settings UI (familyMemberId + current privacySettings).
  getMembership: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.familyMember.findFirst({
        where: { profileId: input.profileId, profile: { userId: ctx.userId } },
      });
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

  // Add an existing profile (owned by the caller) to a family they belong to
  addProfile: protectedProcedure
    .input(z.object({ familyId: z.string().uuid(), profileId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Caller must be a member (or owner) of this family
      const myProfiles = await ctx.prisma.profile.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      const myProfileIds = myProfiles.map((p) => p.id);

      const callerMember = await ctx.prisma.familyMember.findFirst({
        where: { familyId: input.familyId, profileId: { in: myProfileIds } },
      });
      if (!callerMember) throw new TRPCError({ code: 'FORBIDDEN' });

      // Target profile must belong to the caller
      const profile = await ctx.prisma.profile.findFirst({
        where: { id: input.profileId, userId: ctx.userId },
      });
      if (!profile) throw new TRPCError({ code: 'FORBIDDEN' });

      const existing = await ctx.prisma.familyMember.findUnique({
        where: { familyId_profileId: { familyId: input.familyId, profileId: input.profileId } },
      });
      if (existing) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Đã là thành viên' });

      const role = profile.type === 'baby' || profile.type === 'teen' ? 'child' : 'member';
      await ctx.prisma.familyMember.create({
        data: { familyId: input.familyId, profileId: input.profileId, role },
      });
      return { success: true };
    }),
});
