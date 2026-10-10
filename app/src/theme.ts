import type { RiskBand } from './types/models';

export interface Tint {
  ink: string;
  soft: string;
}

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textFaint: string;
  onAccent: string;

  primary: string;
  primaryDeep: string;
  primarySoft: string;
  aqua: string;
  aquaSoft: string;

  bandLowText: string;
  bandLowFill: string;
  bandLowSoft: string;
  bandElevatedText: string;
  bandElevatedFill: string;
  bandElevatedSoft: string;
  bandHighText: string;
  bandHighFill: string;
  bandHighSoft: string;

  destructive: string;
  destructiveSoft: string;

  tints: {
    sage: Tint;
    butter: Tint;
    lilac: Tint;
    sky: Tint;
  };

  heat: string[];

  shadow: string;
}

// No red anywhere near the risk score, the top band is orange.
export const palette: Palette = {
  background: '#FFFFFF',
  surface: '#F4F2F6',
  surfaceAlt: '#EAE6EE',
  surfaceSunken: '#E0DBE5',
  border: '#E4E0E8',
  borderStrong: '#CBC5D1',

  text: '#1E1A22',
  textMuted: '#544E5A',
  textFaint: '#625C68',
  onAccent: '#FFFFFF',

  primary: '#8E44AD',
  primaryDeep: '#6C3483',
  primarySoft: '#F2E7F7',
  aqua: '#137262',
  aquaSoft: '#DDF2EC',

  bandLowText: '#1D7447',
  bandLowFill: '#52B77A',
  bandLowSoft: '#E2F4E8',
  bandElevatedText: '#875700',
  bandElevatedFill: '#F2B33D',
  bandElevatedSoft: '#FDF0D3',
  bandHighText: '#AF4527',
  bandHighFill: '#EE7D57',
  bandHighSoft: '#FDE4DA',

  destructive: '#A8352A',
  destructiveSoft: '#FBE1DC',

  tints: {
    sage: { ink: '#22704F', soft: '#E0F2E7' },
    butter: { ink: '#80590A', soft: '#FCF0CF' },
    lilac: { ink: '#6A44A8', soft: '#EEE6FA' },
    sky: { ink: '#22668F', soft: '#E0EEF8' },
  },

  heat: ['#EEECF0', '#D7F0E0', '#ABDDBE', '#F8DE9C', '#F5B595', '#EA8A6A'],

  shadow: '#000000',
};


export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 44;

export const typography = {
  hero: { fontSize: 56, fontWeight: '700' as const },
  display: { fontSize: 30, fontWeight: '700' as const },
  title: { fontSize: 23, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  micro: { fontSize: 12, fontWeight: '600' as const },
} as const;

export interface BandStyle {
  label: string;
  text: string;
  soft: string;
}

export function bandStyle(band: RiskBand, palette: Palette): BandStyle {
  switch (band) {
    case 'high':
      return {
        label: 'High',
        text: palette.bandHighText,
        soft: palette.bandHighSoft,
      };
    case 'elevated':
      return {
        label: 'Elevated',
        text: palette.bandElevatedText,
        soft: palette.bandElevatedSoft,
      };
    default:
      return {
        label: 'Low',
        text: palette.bandLowText,
        soft: palette.bandLowSoft,
      };
  }
}

export function severityWord(value: number): string {
  if (value === 0) return 'Clear';
  if (value <= 2) return 'Very mild';
  if (value <= 4) return 'Mild';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'Bad';
  return 'Worst it gets';
}
