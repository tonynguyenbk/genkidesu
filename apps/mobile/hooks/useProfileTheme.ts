import { useActiveProfile } from './useActiveProfile';

export type PersonaType = 'adult' | 'baby' | 'teen' | 'senior';

// One brand color across all profiles — accent color is a style choice,
// not an accessibility need, so we keep a single unified look for everyone.
const BRAND_COLOR = '#34C759';

const PERSONA_FONT_SCALE: Record<PersonaType, number> = {
  adult:  1.0,
  teen:   1.0,
  senior: 1.25,
  baby:   1.0,
};

// Minimum tappable button height per persona — senior uses 56px per
// accessibility guidance (large touch targets for reduced dexterity).
const PERSONA_BUTTON_HEIGHT: Record<PersonaType, number> = {
  adult:  48,
  teen:   48,
  senior: 56,
  baby:   48,
};

export function useProfileTheme() {
  const { activeProfile } = useActiveProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = activeProfile as any;
  const profileType = (active?.type ?? 'adult') as PersonaType;
  const uiPrefs = (active?.uiPreferences ?? null) as Record<string, unknown> | null;

  return {
    profileType,
    primaryColor: BRAND_COLOR,
    fontScale: PERSONA_FONT_SCALE[profileType],
    buttonHeight: PERSONA_BUTTON_HEIGHT[profileType],
    isSenior: profileType === 'senior',
    isBaby: profileType === 'baby',
    isTeen: profileType === 'teen',
    isAdult: profileType === 'adult',
    simplifiedMode: (uiPrefs?.simplified_mode as boolean) ?? profileType === 'senior',
  };
}
