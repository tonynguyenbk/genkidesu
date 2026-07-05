import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { embedText } from '../ai/embeddings.js';
import { uploadMealImage } from '../integrations/storage.js';

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

  // "Dạy Genki" — user submits a food (typically a packaged product) with the
  // nutrition values from its label. Saved as an unverified community entry and
  // embedded immediately so RAG matches it on the very next scan, for everyone.
  // Values are entered per serving (as printed on labels) and stored per 100g.
  contribute: protectedProcedure
    .input(z.object({
      nameVi: z.string().min(2).max(200),
      nameEn: z.string().max(200).optional(),
      category: z.enum(['main_dish', 'soup', 'side', 'drink', 'snack', 'dessert', 'baby_food', 'formula']).default('snack'),
      servingG: z.number().min(1).max(2000),
      // Per-serving values, exactly as printed on the nutrition label
      calories: z.number().min(0).max(2000),
      proteinG: z.number().min(0).max(500),
      carbsG: z.number().min(0).max(500),
      fatG: z.number().min(0).max(500),
      fiberG: z.number().min(0).max(200).optional(),
      sugarG: z.number().min(0).max(500).optional(),
      sodiumMg: z.number().min(0).max(50000).optional(),
      imageDataUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const per100 = (v: number) => parseFloat(((v / input.servingG) * 100).toFixed(1));

      const micros: Record<string, number> = {};
      if (input.sugarG != null) micros['sugar_g'] = per100(input.sugarG);
      if (input.sodiumMg != null) micros['sodium_mg'] = per100(input.sodiumMg);

      // Refresh an existing community entry with the same name instead of
      // piling up duplicates; never overwrite expert-verified rows.
      const existing = await ctx.prisma.food.findFirst({
        where: { nameVi: { equals: input.nameVi, mode: 'insensitive' } },
      });
      if (existing?.verified) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Món này đã có dữ liệu chuẩn được chuyên gia xác minh.',
        });
      }

      const data = {
        nameVi: input.nameVi,
        nameEn: input.nameEn ?? null,
        category: input.category,
        region: 'common',
        calPer100g: per100(input.calories),
        proteinPer100g: per100(input.proteinG),
        carbsPer100g: per100(input.carbsG),
        fatPer100g: per100(input.fatG),
        fiberPer100g: input.fiberG != null ? per100(input.fiberG) : null,
        micronutrientsPer100g: Object.keys(micros).length ? micros : undefined,
        typicalPortionG: input.servingG,
        verified: false,
      };

      const food = existing
        ? await ctx.prisma.food.update({ where: { id: existing.id }, data })
        : await ctx.prisma.food.create({ data });

      if (input.imageDataUrl) {
        const imageUrl = await uploadMealImage(input.imageDataUrl, `foods/${food.id}.jpg`);
        if (imageUrl) {
          await ctx.prisma.food.update({ where: { id: food.id }, data: { imageUrl } });
        }
      }

      // Embed now so the next scan already matches this entry. A zero vector
      // (no Gemini key) is skipped — the seed backfill can fill it in later.
      const embedding = await embedText(`${input.nameVi} ${input.nameEn ?? ''}`.trim());
      if (embedding.some((v) => v !== 0)) {
        const vectorLiteral = `[${embedding.join(',')}]`;
        await ctx.prisma.$executeRaw`
          UPDATE foods SET embedding = ${vectorLiteral}::vector WHERE id = ${food.id}::uuid
        `;
      }

      return { id: food.id, nameVi: food.nameVi, learned: embedding.some((v) => v !== 0) };
    }),
});
