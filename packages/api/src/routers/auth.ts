import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Redis } from 'ioredis';
import { publicProcedure, router } from '../trpc.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOTP,
} from '../services/auth.js';
import { getDefaultNutritionTargets, getDefaultUiPreferences } from '../services/tdee.js';

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null, // don't retry if Redis is down
});

redis.on('error', () => {}); // suppress connection errors

const OTP_TTL = 300; // 5 minutes

async function storeOTP(phone: string, otp: string): Promise<void> {
  try {
    await redis.setex(`otp:${phone}`, OTP_TTL, otp);
  } catch {
    // Redis unavailable — fallback to memory
    memoryStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL * 1000 });
  }
}

async function getOTP(phone: string): Promise<string | null> {
  try {
    return await redis.get(`otp:${phone}`);
  } catch {
    const entry = memoryStore.get(phone);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.otp;
  }
}

async function deleteOTP(phone: string): Promise<void> {
  try { await redis.del(`otp:${phone}`); } catch {}
  memoryStore.delete(phone);
}

// Fallback in-memory store
const memoryStore = new Map<string, { otp: string; expiresAt: number }>();

export const authRouter = router({
  loginWithGoogle: publicProcedure
    .input(z.object({ idToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (process.env['NODE_ENV'] !== 'development') {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Configure Google OAuth' });
      }
      const email = `dev-google-${Date.now()}@test.com`;
      const user = await ctx.prisma.user.upsert({
        where: { email },
        update: { lastLoginAt: new Date() },
        create: { email, authProvider: 'google', isActive: true },
      });
      await ensureDefaultProfile(user.id, ctx.prisma);
      return createSession(user.id, ctx.prisma);
    }),

  sendOTP: publicProcedure
    .input(z.object({ phone: z.string().regex(/^(\+84|0)\d{9,10}$/) }))
    .mutation(async ({ input }) => {
      const otp = generateOTP();
      await storeOTP(input.phone, otp);
      const isDev = process.env['NODE_ENV'] !== 'production';
      console.log(`[OTP] ${input.phone}: ${otp} (isDev=${isDev})`);
      return {
        success: true,
        expiresIn: OTP_TTL,
        devOtp: isDev ? otp : null,
      };
    }),

  verifyOTP: publicProcedure
    .input(z.object({ phone: z.string(), otp: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const stored = await getOTP(input.phone);
      if (!stored) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mã OTP không tồn tại hoặc đã hết hạn' });
      }
      if (stored !== input.otp) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mã OTP không đúng' });
      }
      await deleteOTP(input.phone);

      const user = await ctx.prisma.user.upsert({
        where: { phone: input.phone },
        update: { lastLoginAt: new Date() },
        create: { phone: input.phone, authProvider: 'phone', isActive: true },
      });
      await ensureDefaultProfile(user.id, ctx.prisma);
      return createSession(user.id, ctx.prisma);
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const payload = await verifyRefreshToken(input.refreshToken).catch(() => {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Refresh token không hợp lệ' });
      });
      const session = await ctx.prisma.session.findUnique({ where: { refreshToken: input.refreshToken } });
      if (!session || session.expiresAt < new Date()) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Phiên đăng nhập đã hết hạn' });
      }
      await ctx.prisma.session.delete({ where: { id: session.id } });
      return createSession(payload.sub!, ctx.prisma);
    }),

  logout: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.session.deleteMany({ where: { refreshToken: input.refreshToken } });
      return { success: true };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { profiles: true },
    });
  }),
});

async function ensureDefaultProfile(userId: string, prisma: typeof import('@genki/db').prisma) {
  const count = await prisma.profile.count({ where: { userId } });
  if (count === 0) {
    await prisma.profile.create({
      data: {
        userId,
        name: 'Tôi',
        type: 'adult',
        activityLevel: 2,
        uiPreferences: getDefaultUiPreferences('adult'),
        nutritionTargets: getDefaultNutritionTargets('adult', null),
      },
    });
  }
}

async function createSession(userId: string, prisma: typeof import('@genki/db').prisma) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId),
  ]);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.session.create({
    data: { userId, token: accessToken, refreshToken, expiresAt },
  });
  const profiles = await prisma.profile.findMany({ where: { userId } });
  return { accessToken, refreshToken, profiles };
}
