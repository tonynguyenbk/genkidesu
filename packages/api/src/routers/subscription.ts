import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc.js';

export type SubscriptionPlan = 'free' | 'pro' | 'family';

const PLANS = [
  {
    id: 'free' as SubscriptionPlan,
    name: 'Miễn phí',
    price: 0,
    priceLabel: '0đ',
    period: 'mãi mãi',
    color: '#6B7280',
    features: [
      '3 ảnh/ngày',
      'Nhật ký 7 ngày',
      'Calories + 3 macro',
      '1 hồ sơ',
    ],
    limits: { photosPerDay: 3, historyDays: 7, profiles: 1 },
  },
  {
    id: 'pro' as SubscriptionPlan,
    name: 'Pro',
    price: 59000,
    priceLabel: '59.000đ',
    period: '/tháng',
    color: '#2ECC71',
    badge: 'Phổ biến',
    features: [
      'Không giới hạn ảnh',
      'Nhật ký không giới hạn',
      '15+ vi chất dinh dưỡng',
      'AI tư vấn dinh dưỡng',
      'Đồng bộ wearable',
      'Báo cáo tuần/tháng',
      'Tối đa 2 hồ sơ',
    ],
    limits: { photosPerDay: -1, historyDays: -1, profiles: 2 },
  },
  {
    id: 'family' as SubscriptionPlan,
    name: 'Gia đình',
    price: 129000,
    priceLabel: '129.000đ',
    period: '/tháng',
    color: '#8B5CF6',
    badge: 'Tiết kiệm nhất',
    features: [
      'Tất cả tính năng Pro',
      'Tối đa 4 hồ sơ gia đình',
      'Dashboard gia đình',
      'Mục tiêu riêng từng người',
      'Cảnh báo sức khỏe gia đình',
      'Ưu tiên hỗ trợ',
    ],
    limits: { photosPerDay: -1, historyDays: -1, profiles: 4 },
  },
];

export const subscriptionRouter = router({
  getPlans: publicProcedure.query(() => PLANS),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    // Future: query RevenueCat or subscriptions table
    // For now, all users are on free plan
    return {
      plan: 'free' as SubscriptionPlan,
      expiresAt: null as string | null,
      photosUsedToday: 0,
      limits: PLANS[0]!.limits,
    };
  }),

  // Stub: will be replaced by RevenueCat webhook
  purchase: protectedProcedure
    .input(z.object({ planId: z.enum(['pro', 'family']) }))
    .mutation(async ({ input }) => {
      // Real implementation: call RevenueCat SDK from client, verify receipt here
      return { success: false, message: 'RevenueCat integration coming soon' };
    }),
});
