/** Drug Wars Reloaded — cinematic dark crime-market design tokens. */

export const palette = {
  bg: '#08080c',
  bgElevated: '#0e0e14',
  bgCard: '#14141c',
  bgCardHover: '#1a1a24',
  bgGloss: 'rgba(255,255,255,0.04)',
  border: '#2a2a38',
  borderBright: '#3d3d50',
  borderGlow: 'rgba(57, 255, 20, 0.35)',

  text: '#f0f4f0',
  textSecondary: '#9aa89a',
  textMuted: '#5c665c',

  neon: '#39ff14',
  neonDim: '#1faa0a',
  neonGlow: 'rgba(57, 255, 20, 0.18)',
  neonSoft: 'rgba(57, 255, 20, 0.08)',

  danger: '#ff4b2b',
  dangerDim: '#cc3320',
  dangerGlow: 'rgba(255, 75, 43, 0.18)',

  purple: '#9d50bb',
  purpleBright: '#b388ff',
  purpleGlow: 'rgba(157, 80, 187, 0.22)',

  amber: '#ffb020',
  amberDim: '#cc8800',
  amberGlow: 'rgba(255, 176, 32, 0.18)',

  info: '#5eb3ff',
  cyan: '#00e5ff',

  cash: '#39ff14',
  debt: '#ff6b6b',
  netWorth: '#b388ff',
};

/** @deprecated Use palette — kept for legacy imports */
export const colors = {
  background: palette.bg,
  backgroundAlt: palette.bgElevated,
  surface: palette.bgCard,
  surfaceLight: palette.bgCardHover,
  surfaceRaised: '#1e1e28',
  border: palette.border,
  borderBright: palette.borderBright,
  text: palette.text,
  textDim: palette.textSecondary,
  textMuted: palette.textMuted,
  accent: palette.neon,
  accentDim: palette.neonDim,
  accentGlow: palette.neonSoft,
  accentPink: '#ff2d95',
  accentCyan: palette.cyan,
  danger: palette.danger,
  dangerDim: palette.dangerDim,
  dangerGlow: palette.dangerGlow,
  warning: palette.amber,
  warningDim: palette.amberDim,
  info: palette.info,
  purple: palette.purpleBright,
  cash: palette.cash,
  debt: palette.debt,
  gold: palette.amber,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fonts = {
  display: 'monospace' as const,
  body: 'monospace' as const,
  mono: 'monospace' as const,
};

export const touch = {
  minHeight: 48,
  minWidth: 48,
};

export const typography = {
  micro: 9,
  caption: 11,
  body: 14,
  subtitle: 16,
  title: 20,
  hero: 26,
  display: 32,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  glowGreen: {
    shadowColor: palette.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  glowPurple: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const gradients = {
  cardSheen: palette.bgGloss,
  heroGreen: ['rgba(57,255,20,0.15)', 'rgba(57,255,20,0)'] as const,
  heroPurple: ['rgba(157,80,187,0.35)', 'rgba(157,80,187,0)'] as const,
  heroDanger: ['rgba(255,75,43,0.3)', 'rgba(255,75,43,0)'] as const,
};

export type AccentTone = 'green' | 'red' | 'purple' | 'amber' | 'neutral';

export const accentMap: Record<
  AccentTone,
  { border: string; bg: string; text: string; glow: string }
> = {
  green: {
    border: palette.neonDim,
    bg: palette.neonSoft,
    text: palette.neon,
    glow: palette.neonGlow,
  },
  red: {
    border: palette.dangerDim,
    bg: palette.dangerGlow,
    text: palette.danger,
    glow: palette.dangerGlow,
  },
  purple: {
    border: palette.purple,
    bg: palette.purpleGlow,
    text: palette.purpleBright,
    glow: palette.purpleGlow,
  },
  amber: {
    border: palette.amberDim,
    bg: palette.amberGlow,
    text: palette.amber,
    glow: palette.amberGlow,
  },
  neutral: {
    border: palette.borderBright,
    bg: palette.bgGloss,
    text: palette.textSecondary,
    glow: 'transparent',
  },
};
