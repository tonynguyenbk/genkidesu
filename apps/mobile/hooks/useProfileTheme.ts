// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { trpc } from '../lib/trpc';

export type PersonaType = 'adult' | 'baby' | 'teen' | 'senior';

const PERSONA_COLORS: Record<PersonaType, string> = {
  adult:  '#2ECC71',
  teen:   '#8B5CF6',
  senior: '#F59E0B',
  baby:   '#EC4899',
};

const PERSONA_FONT_SCALE: Record<PersonaType, number> = {
  adult:  1.0,
  teen:   1.0,
  senior: 1.25,
  baby:   1.0,
};

export function useProfileTheme() {
  const profiles = trpc.profile.list.useQuery(undefined, { retry: false, staleTime: 60_000 });
  // Cast to any to avoid TS2589 on deep Prisma type inference
  const first = (profiles.data as any)?.[0] ?? null;
  const profileType = (first?.type ?? 'adult') as PersonaType;
  const uiPrefs = (first?.uiPreferences ?? null) as Record<string, unknown> | null;

  return {
    profileType,
    primaryColor: PERSONA_COLORS[profileType],
    fontScale: PERSONA_FONT_SCALE[profileType],
    isSenior: profileType === 'senior',
    isBaby: profileType === 'baby',
    isTeen: profileType === 'teen',
    isAdult: profileType === 'adult',
    simplifiedMode: (uiPrefs?.simplified_mode as boolean) ?? profileType === 'senior',
  };
}
