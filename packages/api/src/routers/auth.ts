import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOTP,
} from '../services/auth.js';
import { getDefaultNutritionTargets, getDefaultUiPreferences } from '../services/tdee.js';

const OTP_STORE = new Map<string, { otp: string; expiresAt: number }>();

export const authRouter = router({
  loginWithGoogle: publicProcedure
    .input(z.object({ idToken: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      // In production: verify with Google OAuth2 library
      // Dev mode: accept any non-empty token
      if (process.env['NODE_ENV'] !== 'development') {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Configure Google OAuth' });
      }

      const email = `dev-google-${Date.now()}@test.com`;
      const user = await ctx.prisma.user.upsert({
        where: { email },
        update: { lastLoginAt: new Date() },
        create: { email, authProvider: 'google', isActive: true },
      });

      const profiles = await ctx.prisma.profile.findMany({ where: { userId: user.id } });
      if (profiles.length === 0) {
        await ctx.prisma.profile.create({
          data: {
            userId: user.id,
            name: 'Tôi',
            type: 'adult',
            activityLevel: 2,
            uiPreferences: getDefaultUiPreferences('adult'),
            nutritionTargets: getDefaultNutritionTargets('adult', null),
          },
        });
      }

      return createSession(user.id, ctx.prisma);
    }),

  sendOTP: publicProcedure
    .input(z.object({ phone: z.string().regex(/^(\+84|0)\d{9,10}$/) }))
    .mutation(async ({ input }) => {
      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      OTP_STORE.set(input.phone, { otp, expiresAt });

      if (process.env['NODE_ENV'] === 'development') {
        console.log(`[DEV] OTP for ${input.phone}: ${otp}`);
      }
      // Production: send via Twilio

      return { success: true, expiresIn: 300 };
    }),

  verifyOTP: publicProcedure
    .input(z.object({ phone: z.string(), otp: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const stored = OTP_STORE.get(input.phone);
      if (!stored || stored.otp !== input.otp) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mã OTP không đúng' });
      }
      if (Date.now() > stored.expiresAt) {
        OTP_STORE.delete(input.phone);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mã OTP đã hết hạn' });
      }
      OTP_STORE.delete(input.phone);

      const user = await ctx.prisma.user.upsert({
        where: { phone: input.phone },
        update: { lastLoginAt: new Date() },
        create: { phone: input.phone, authProvider: 'phone', isActive: true },
      });

      const profiles = await ctx.prisma.profile.findMany({ where: { userId: user.id } });
      if (profiles.length === 0) {
        await ctx.prisma.profile.create({
          data: {
            userId: user.id,
            name: 'Tôi',
            type: 'adult',
            activityLevel: 2,
            uiPreferences: getDefaultUiPreferences('adult'),
            nutritionTargets: getDefaultNutritionTargets('adult', null),
          },
        });
      }

      return createSession(user.id, ctx.prisma);
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const payload = await verifyRefreshToken(input.refreshToken).catch(() => {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Refresh token không hợp lệ' });
      });

      const session = await ctx.prisma.session.findUnique({
        where: { refreshToken: input.refreshToken },
      });
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
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { profiles: true },
    });
    return user;
  }),
});

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
