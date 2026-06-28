/** Drug Wars Reloaded — AAA mobile design tokens (presentation layer). */

export const palette = {
  /** Deep black — primary canvas */
  bg: '#05060A',
  /** Charcoal — elevated surfaces */
  charcoal: '#0A0D14',
  bgElevated: '#10131A',
  bgCard: '#10131A',
  bgCardHover: '#171B24',
  bgGloss: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.14)',
  borderGlow: 'rgba(53, 255, 136, 0.35)',

  text: '#F4F7FB',
  textSecondary: '#9AA3B2',
  textMuted: '#6B7380',

  neon: '#35FF88',
  neonDim: '#1FAF5C',
  neonGlow: 'rgba(53, 255, 136, 0.22)',
  neonSoft: 'rgba(53, 255, 136, 0.1)',

  danger: '#FF3B4F',
  dangerDim: '#CC2A3A',
  dangerGlow: 'rgba(255, 59, 79, 0.18)',

  purple: '#9B5CFF',
  purpleBright: '#B388FF',
  purpleGlow: 'rgba(155, 92, 255, 0.22)',

  gold: '#FFB84D',
  amber: '#FFB84D',
  amberDim: '#CC9220',
  amberGlow: 'rgba(255, 184, 77, 0.18)',

  cyan: '#39C8FF',
  info: '#39C8FF',

  cash: '#35FF88',
  debt: '#FF3B4F',
  netWorth: '#9B5CFF',
};

/** Semantic color roles — use instead of raw hex in UI */
export const semantic = {
  canvas: palette.bg,
  surface: palette.bgCard,
  surfaceRaised: palette.bgCardHover,
  charcoal: palette.charcoal,
  primary: palette.neon,
  secondary: palette.cyan,
  success: palette.neon,
  warning: palette.gold,
  danger: palette.danger,
  info: palette.cyan,
  money: palette.cash,
  debt: palette.debt,
  netWorth: palette.netWorth,
  textPrimary: palette.text,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  border: palette.border,
  borderFocus: palette.borderGlow,
};

export const glass = {
  opacity: 0.72,
  blur: 12,
  sheenTop: 'rgba(255,255,255,0.06)',
  sheenBottom: 'rgba(255,255,255,0.01)',
  borderGradient: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)'] as const,
};

export const animation = {
  fast: 120,
  normal: 220,
  slow: 380,
  spring: { speed: 40, bounciness: 4 },
  pressScale: 0.97,
  shimmerDuration: 1400,
};

export const elevation = {
  flat: 0,
  card: 10,
  raised: 14,
  modal: 20,
};

export const buttons = {
  heightSm: 42,
  heightMd: 48,
  heightLg: 54,
  radius: 20,
  iconGap: 8,
};

/** @deprecated Use palette — kept for legacy imports */
export const colors = {
  background: palette.bg,
  backgroundAlt: palette.bgElevated,
  surface: palette.bgCard,
  surfaceLight: palette.bgCardHover,
  surfaceRaised: palette.bgCardHover,
  border: palette.border,
  borderBright: palette.borderBright,
  text: palette.text,
  textDim: palette.textSecondary,
  textMuted: palette.textMuted,
  accent: palette.neon,
  accentDim: palette.neonDim,
  accentGlow: palette.neonSoft,
  accentPink: palette.danger,
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
  gold: palette.gold,
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
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const fonts = {
  display: undefined as unknown as string,
  body: undefined as unknown as string,
  mono: 'monospace' as const,
};

export const touch = {
  minHeight: 48,
  minWidth: 48,
};

export const typography = {
  tiny: 10,
  caption: 12,
  body: 14,
  subtitle: 16,
  title: 20,
  hero: 28,
  display: 36,
  money: 32,
  moneyHero: 40,
};

/** Prebuilt text hierarchy — import instead of ad-hoc fontSize */
export const textStyles = {
  display: { fontSize: 36, fontWeight: '900' as const, letterSpacing: -0.5, color: palette.text },
  screenTitle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: 0.2, color: palette.text },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: palette.text },
  cardTitle: { fontSize: 14, fontWeight: '700' as const, color: palette.text },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, color: palette.text },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, color: palette.textSecondary },
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8, color: palette.textMuted, textTransform: 'uppercase' as const },
  money: { fontSize: 32, fontWeight: '900' as const, letterSpacing: 0.3, color: palette.cash },
  moneyHero: { fontSize: 40, fontWeight: '900' as const, letterSpacing: 0.2, color: palette.cash },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  glowGreen: {
    shadowColor: palette.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  glowGold: {
    shadowColor: palette.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  glowRed: {
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glowCyan: {
    shadowColor: palette.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const gradients = {
  cardSheen: palette.bgGloss,
  heroGreen: ['rgba(53,255,136,0.18)', 'rgba(53,255,136,0)'] as const,
  heroPurple: ['rgba(155,92,255,0.28)', 'rgba(155,92,255,0)'] as const,
  heroDanger: ['rgba(255,59,79,0.25)', 'rgba(255,59,79,0)'] as const,
  heroGold: ['rgba(255,184,77,0.22)', 'rgba(255,184,77,0)'] as const,
  heroCyan: ['rgba(57,200,255,0.2)', 'rgba(57,200,255,0)'] as const,
  cinematicBg: ['#05060A', '#0A0D14', '#05060A'] as const,
  headerFade: ['rgba(16,19,26,0.98)', 'rgba(5,6,10,0)'] as const,
};

export type AccentTone = 'green' | 'red' | 'purple' | 'amber' | 'cyan' | 'neutral';

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
  cyan: {
    border: palette.cyan,
    bg: 'rgba(57, 200, 255, 0.12)',
    text: palette.cyan,
    glow: 'rgba(57, 200, 255, 0.2)',
  },
  neutral: {
    border: palette.borderBright,
    bg: palette.bgGloss,
    text: palette.textSecondary,
    glow: 'transparent',
  },
};

export type RiskLevel = 'low' | 'medium' | 'high';

export const riskAccentMap: Record<
  RiskLevel,
  { border: string; bg: string; text: string; glow: typeof shadows.glowGreen }
> = {
  low: {
    border: palette.neonDim,
    bg: palette.neonSoft,
    text: palette.neon,
    glow: shadows.glowGreen,
  },
  medium: {
    border: palette.amberDim,
    bg: palette.amberGlow,
    text: palette.amber,
    glow: shadows.glowGold,
  },
  high: {
    border: palette.dangerDim,
    bg: palette.dangerGlow,
    text: palette.danger,
    glow: shadows.glowRed,
  },
};
