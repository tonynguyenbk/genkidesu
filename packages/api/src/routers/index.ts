import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { profileRouter } from './profile.js';
import { familyRouter } from './family.js';
import { foodRouter } from './food.js';
import { mealRouter } from './meal.js';

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  family: familyRouter,
  food: foodRouter,
  meal: mealRouter,
});

export type AppRouter = typeof appRouter;
