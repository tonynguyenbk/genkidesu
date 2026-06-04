import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { profileRouter } from './profile.js';
import { familyRouter } from './family.js';

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  family: familyRouter,
});

export type AppRouter = typeof appRouter;
