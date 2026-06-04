import { z } from 'zod';

export const phoneSchema = z.string().regex(/^(\+84|0)\d{9,10}$/, 'Số điện thoại không hợp lệ');

export const loginWithGoogleSchema = z.object({
  idToken: z.string().min(1),
});

export const loginWithAppleSchema = z.object({
  identityToken: z.string().min(1),
  fullName: z
    .object({
      givenName: z.string().optional(),
      familyName: z.string().optional(),
    })
    .optional(),
});

export const sendOTPSchema = z.object({
  phone: phoneSchema,
});

export const verifyOTPSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP phải có 6 chữ số').regex(/^\d{6}$/),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
