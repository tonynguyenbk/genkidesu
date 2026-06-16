import type { ProfileType } from '@genki/shared';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    divider: string;
    error: string;
    errorBg: string;
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    info: string;
    infoBg: string;
    overlay: string;
    shadow: string;
  };
  typography: {
    fontSizeBase: number;
    fontSizeSmall: number;
    fontSizeLarge: number;
    fontSizeTitle: number;
    lineHeightBase: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}

const baseTheme: Omit<Theme, 'colors' | 'typography'> = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 16, full: 9999 },
};

// Neutrals + semantic colors shared by every persona, split by color scheme.
const sharedColors: Record<ColorScheme, Omit<Theme['colors'], 'primary' | 'secondary' | 'background' | 'surfaceAlt'>> = {
  light: {
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    success: '#22C55E',
    successBg: '#D1FAE5',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    overlay: '#00000066',
    shadow: '#000000',
  },
  dark: {
    surface: '#161B22',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D333B',
    divider: '#21262D',
    error: '#F87171',
    errorBg: '#2D1416',
    success: '#34D399',
    successBg: '#102420',
    warning: '#FBBF24',
    warningBg: '#2A2010',
    info: '#60A5FA',
    infoBg: '#111D2E',
    overlay: '#000000B3',
    shadow: '#000000',
  },
};

// Persona-specific brand color, page background, and tinted "alt surface"
// (icon circles, badges) for each color scheme.
const personaColors: Record<ProfileType, Record<ColorScheme, Pick<Theme['colors'], 'primary' | 'secondary' | 'background' | 'surfaceAlt'>>> = {
  adult: {
    light: { primary: '#2ECC71', secondary: '#27AE60', background: '#F8FBF9', surfaceAlt: '#F0FDF4' },
    dark: { primary: '#2ECC71', secondary: '#34D399', background: '#0D1117', surfaceAlt: '#16241D' },
  },
  senior: {
    light: { primary: '#2ECC71', secondary: '#27AE60', background: '#F8FBF9', surfaceAlt: '#F0FDF4' },
    dark: { primary: '#2ECC71', secondary: '#34D399', background: '#0D1117', surfaceAlt: '#16241D' },
  },
  teen: {
    light: { primary: '#8B5CF6', secondary: '#7C3AED', background: '#FAFAFA', surfaceAlt: '#F5F3FF' },
    dark: { primary: '#A78BFA', secondary: '#8B5CF6', background: '#0D1117', surfaceAlt: '#1E1B2E' },
  },
  baby: {
    light: { primary: '#EC4899', secondary: '#DB2777', background: '#FFF5F9', surfaceAlt: '#FCE7F3' },
    dark: { primary: '#F472B6', secondary: '#EC4899', background: '#0D1117', surfaceAlt: '#2A1620' },
  },
};

const typographyByPersona: Record<ProfileType, Theme['typography']> = {
  adult: {
    fontSizeBase: 16,
    fontSizeSmall: 14,
    fontSizeLarge: 18,
    fontSizeTitle: 24,
    lineHeightBase: 24,
  },
  senior: {
    fontSizeBase: 18,
    fontSizeSmall: 16,
    fontSizeLarge: 22,
    fontSizeTitle: 28,
    lineHeightBase: 28,
  },
  teen: {
    fontSizeBase: 16,
    fontSizeSmall: 14,
    fontSizeLarge: 18,
    fontSizeTitle: 24,
    lineHeightBase: 24,
  },
  baby: {
    fontSizeBase: 16,
    fontSizeSmall: 14,
    fontSizeLarge: 18,
    fontSizeTitle: 24,
    lineHeightBase: 24,
  },
};

export function getTheme(profileType: ProfileType, colorScheme: ColorScheme = 'light'): Theme {
  return {
    ...baseTheme,
    colors: {
      ...sharedColors[colorScheme],
      ...personaColors[profileType][colorScheme],
    },
    typography: typographyByPersona[profileType],
  };
}

// Back-compat: existing callers that only care about the light theme per persona.
export const themes: Record<ProfileType, Theme> = {
  adult: getTheme('adult', 'light'),
  senior: getTheme('senior', 'light'),
  teen: getTheme('teen', 'light'),
  baby: getTheme('baby', 'light'),
};
