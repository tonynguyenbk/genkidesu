import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';

export const foodRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.food.findMany({
        where: {
          OR: [
            { nameVi: { contains: input.query, mode: 'insensitive' } },
            { nameEn: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
        orderBy: { verified: 'desc' },
      });
    }),

  list: publicProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().int().default(20) }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.food.findMany({
        where: input.category ? { category: input.category } : undefined,
        take: input.limit,
        orderBy: { nameVi: 'asc' },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.food.findUnique({ where: { id: input.id } });
    }),
});
