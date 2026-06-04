import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './routers/index.js';
import { createContext } from './trpc.js';

const server = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'development' ? 'info' : 'warn',
  },
});

await server.register(cors, { origin: true, credentials: true });

await server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env['PORT'] ?? 4000);

try {
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`API running at http://localhost:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
