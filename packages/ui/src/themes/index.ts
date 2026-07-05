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

// Apple HIG design language (owner decision 2026-07-04): iOS system palette,
// SF Pro type scale (system font — never bundle SF on Android), radius 12 for
// cards, hairline alpha separators, true-black dark mode.
const baseTheme: Omit<Theme, 'colors' | 'typography'> = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 16, full: 9999 },
};

// Neutrals + semantic colors shared by every persona, split by color scheme.
// Values follow iOS system colors (label hierarchy via alpha, not grey ramps).
const sharedColors: Record<ColorScheme, Omit<Theme['colors'], 'primary' | 'secondary' | 'background' | 'surfaceAlt'>> = {
  light: {
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: 'rgba(60,60,67,0.60)',
    textTertiary: 'rgba(60,60,67,0.30)',
    border: 'rgba(60,60,67,0.29)',
    divider: 'rgba(60,60,67,0.12)',
    error: '#FF3B30',
    errorBg: '#FFEBE9',
    success: '#34C759',
    successBg: '#E3F7E9',
    warning: '#FF9500',
    warningBg: '#FFF3E0',
    info: '#007AFF',
    infoBg: '#E5F1FF',
    overlay: '#00000066',
    shadow: '#000000',
  },
  dark: {
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: 'rgba(235,235,245,0.60)',
    textTertiary: 'rgba(235,235,245,0.30)',
    border: 'rgba(84,84,88,0.60)',
    divider: 'rgba(84,84,88,0.35)',
    error: '#FF453A',
    errorBg: '#3A1D1B',
    success: '#30D158',
    successBg: '#12291A',
    warning: '#FF9F0A',
    warningBg: '#332410',
    info: '#0A84FF',
    infoBg: '#102A43',
    overlay: '#000000B3',
    shadow: '#000000',
  },
};

// Persona-specific brand color, page background, and tinted "alt surface"
// (icon circles, badges) for each color scheme.
const personaColors: Record<ProfileType, Record<ColorScheme, Pick<Theme['colors'], 'primary' | 'secondary' | 'background' | 'surfaceAlt'>>> = {
  // iOS systemGreen; grouped background #F2F2F7 light / true black dark
  adult: {
    light: { primary: '#34C759', secondary: '#248A3D', background: '#F2F2F7', surfaceAlt: '#E9F8EE' },
    dark: { primary: '#30D158', secondary: '#30DB5B', background: '#000000', surfaceAlt: '#12291A' },
  },
  senior: {
    light: { primary: '#34C759', secondary: '#248A3D', background: '#F2F2F7', surfaceAlt: '#E9F8EE' },
    dark: { primary: '#30D158', secondary: '#30DB5B', background: '#000000', surfaceAlt: '#12291A' },
  },
  // iOS systemPurple
  teen: {
    light: { primary: '#AF52DE', secondary: '#8944AB', background: '#F2F2F7', surfaceAlt: '#F5EAFB' },
    dark: { primary: '#BF5AF2', secondary: '#DA8FFF', background: '#000000', surfaceAlt: '#28182F' },
  },
  // iOS systemPink
  baby: {
    light: { primary: '#FF2D55', secondary: '#D30F45', background: '#F2F2F7', surfaceAlt: '#FFECEF' },
    dark: { primary: '#FF375F', secondary: '#FF6482', background: '#000000', surfaceAlt: '#331418' },
  },
};

// SF Pro scale: body 17 / subhead 15 / title3 20 / large-title-ish 28.
// Senior bumps every step (HIG Dynamic Type xxxLarge equivalent).
const typographyByPersona: Record<ProfileType, Theme['typography']> = {
  adult: {
    fontSizeBase: 17,
    fontSizeSmall: 15,
    fontSizeLarge: 20,
    fontSizeTitle: 28,
    lineHeightBase: 22,
  },
  senior: {
    fontSizeBase: 19,
    fontSizeSmall: 17,
    fontSizeLarge: 23,
    fontSizeTitle: 32,
    lineHeightBase: 26,
  },
  teen: {
    fontSizeBase: 17,
    fontSizeSmall: 15,
    fontSizeLarge: 20,
    fontSizeTitle: 28,
    lineHeightBase: 22,
  },
  baby: {
    fontSizeBase: 17,
    fontSizeSmall: 15,
    fontSizeLarge: 20,
    fontSizeTitle: 28,
    lineHeightBase: 22,
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
