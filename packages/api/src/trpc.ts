import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { prisma } from '@genki/db';
import { verifyAccessToken } from './services/auth.js';

export async function createContext({ req }: CreateFastifyContextOptions) {
  const authorization = req.headers['authorization'];
  let userId: string | null = null;

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      userId = payload.sub ?? null;
    } catch {
      // invalid token — stays null
    }
  }

  return { req, prisma, userId };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Bạn cần đăng nhập' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
