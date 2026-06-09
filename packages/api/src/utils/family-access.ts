import { TRPCError } from '@trpc/server';
import { prisma } from '@genki/db';

type PrismaInstance = typeof prisma;

// Allows a user to access a profile that isn't theirs if they share a family.
// Returns the profile (to avoid a second fetch at the call site).
export async function assertProfileAccess(
  db: PrismaInstance,
  userId: string,
  profileId: string,
) {
  const profile = await db.profile.findFirst({
    where: { id: profileId, isActive: true },
  });
  if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
  if (profile.userId === userId) return profile;

  // Cross-user: allow if they share a family
  const myProfiles = await db.profile.findMany({
    where: { userId },
    select: { id: true },
  });
  const shared = await db.familyMember.findFirst({
    where: {
      profileId,
      family: {
        members: { some: { profileId: { in: myProfiles.map((p) => p.id) } } },
      },
    },
  });
  if (!shared) throw new TRPCError({ code: 'FORBIDDEN' });
  return profile;
}
