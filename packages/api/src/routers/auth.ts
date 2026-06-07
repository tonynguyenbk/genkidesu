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
  // Always store in memory as primary (instant, no network)
  memoryStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL * 1000 });
  // Also try Redis as secondary (for multi-instance)
  try { await redis.setex(`otp:${phone}`, OTP_TTL, otp); } catch {}
}

async function getOTP(phone: string): Promise<string | null> {
  // Check memory first (most reliable in single-instance dev)
  const entry = memoryStore.get(phone);
  if (entry) {
    if (Date.now() > entry.expiresAt) { memoryStore.delete(phone); return null; }
    return entry.otp;
  }
  // Fallback to Redis (for multi-instance prod)
  try {
    return await redis.get(`otp:${phone}`);
  } catch {
    return null;
  }
}

async function deleteOTP(phone: string): Promise<void> {
  memoryStore.delete(phone);
  try { await redis.del(`otp:${phone}`); } catch {}
}

// Fallback in-memory store
const memoryStore = new Map<string, { otp: string; expiresAt: number }>();

interface GoogleTokenPayload {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Google token không hợp lệ' });
  }
  const payload = (await res.json()) as GoogleTokenPayload;
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  if (clientId && payload.aud !== clientId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Google token không thuộc ứng dụng này' });
  }
  return payload;
}

interface FacebookProfile {
  id: string;
  name?: string;
  email?: string;
  error?: { message?: string };
}

async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookProfile> {
  const res = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
  );
  const payload = (await res.json()) as FacebookProfile;
  if (!res.ok || payload.error || !payload.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Facebook token không hợp lệ' });
  }
  return payload;
}

export const authRouter = router({
  loginWithGoogle: publicProcedure
    .input(z.object({ idToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const profile = await verifyGoogleIdToken(input.idToken);
      if (!profile.email) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tài khoản Google không có email' });
      }
      const user = await ctx.prisma.user.upsert({
        where: { email: profile.email },
        update: { lastLoginAt: new Date() },
        create: { email: profile.email, authProvider: 'google', isActive: true },
      });
      await ensureDefaultProfile(user.id, ctx.prisma);
      return createSession(user.id, ctx.prisma);
    }),

  loginWithFacebook: publicProcedure
    .input(z.object({ accessToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const profile = await verifyFacebookAccessToken(input.accessToken);
      // Facebook accounts don't always expose an email — derive a stable fallback from the FB id
      const email = profile.email ?? `fb-${profile.id}@facebook.genki.local`;
      const user = await ctx.prisma.user.upsert({
        where: { email },
        update: { lastLoginAt: new Date() },
        create: { email, authProvider: 'facebook', isActive: true },
      });
      await ensureDefaultProfile(user.id, ctx.prisma);
      return createSession(user.id, ctx.prisma);
    }),

  sendOTP: publicProcedure
    .input(z.object({ phone: z.string().regex(/^(\+84|0)\d{9,10}$/) }))
    .mutation(async ({ input }) => {
      const otp = generateOTP();
      await storeOTP(input.phone, otp);
      const smsEnabled = !!process.env['TWILIO_ACCOUNT_SID'];
      console.log(`[OTP] ${input.phone}: ${otp} (sms=${smsEnabled})`);
      return {
        success: true,
        expiresIn: OTP_TTL,
        // Return OTP directly until Twilio is configured
        devOtp: smsEnabled ? null : otp,
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
