import { z } from 'zod';

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Tên gia đình không được để trống').max(100),
});

export const joinFamilySchema = z.object({
  inviteCode: z.string().length(8, 'Mã mời phải có 8 ký tự').toUpperCase(),
  profileId: z.string().uuid(),
});

export const addChildProfileSchema = z.object({
  familyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['baby', 'teen']),
  birthDate: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export const updatePrivacySchema = z.object({
  familyMemberId: z.string().uuid(),
  privacySettings: z.object({
    showDetailsToFamily: z.boolean(),
    showMealLogs: z.boolean(),
  }),
});
