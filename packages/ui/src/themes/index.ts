import type { ProfileType } from '@genki/shared';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
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

export const themes: Record<ProfileType, Theme> = {
  adult: {
    ...baseTheme,
    colors: {
      primary: '#2ECC71',
      secondary: '#27AE60',
      background: '#F8FBF9',
      surface: '#FFFFFF',
      text: '#1A1A2E',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
    },
    typography: {
      fontSizeBase: 16,
      fontSizeSmall: 14,
      fontSizeLarge: 18,
      fontSizeTitle: 24,
      lineHeightBase: 24,
    },
  },
  senior: {
    ...baseTheme,
    colors: {
      primary: '#2ECC71',
      secondary: '#27AE60',
      background: '#F8FBF9',
      surface: '#FFFFFF',
      text: '#1A1A2E',
      textSecondary: '#4B5563',
      border: '#D1D5DB',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
    },
    typography: {
      fontSizeBase: 18,
      fontSizeSmall: 16,
      fontSizeLarge: 22,
      fontSizeTitle: 28,
      lineHeightBase: 28,
    },
  },
  teen: {
    ...baseTheme,
    colors: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
    },
    typography: {
      fontSizeBase: 16,
      fontSizeSmall: 14,
      fontSizeLarge: 18,
      fontSizeTitle: 24,
      lineHeightBase: 24,
    },
  },
  baby: {
    ...baseTheme,
    colors: {
      primary: '#EC4899',
      secondary: '#DB2777',
      background: '#FFF5F9',
      surface: '#FFFFFF',
      text: '#374151',
      textSecondary: '#9CA3AF',
      border: '#FCE7F3',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
    },
    typography: {
      fontSizeBase: 16,
      fontSizeSmall: 14,
      fontSizeLarge: 18,
      fontSizeTitle: 24,
      lineHeightBase: 24,
    },
  },
};

export function getTheme(profileType: ProfileType): Theme {
  return themes[profileType];
}
