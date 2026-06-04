import { z } from 'zod';

export const profileTypeSchema = z.enum(['adult', 'baby', 'teen', 'senior']);
export const genderSchema = z.enum(['male', 'female', 'other']);
export const activityLevelSchema = z.number().int().min(1).max(5);

export const createProfileSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(100),
  type: profileTypeSchema,
  birthDate: z.string().datetime().optional(),
  gender: genderSchema.optional(),
  heightCm: z.number().min(30).max(250).optional(),
  weightKg: z.number().min(1).max(300).optional(),
  activityLevel: activityLevelSchema.optional(),
});

export const updateProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  heightCm: z.number().min(30).max(250).optional(),
  weightKg: z.number().min(1).max(300).optional(),
  activityLevel: activityLevelSchema.optional(),
  uiPreferences: z.record(z.unknown()).optional(),
});
