/** Consistent iconography — single source for UI emoji/symbol tokens */

export const AppIcons = {
  money: '💵',
  dirty: '💸',
  clean: '✨',
  debt: '🔒',
  netWorth: '🏦',
  heat: '🔥',
  police: '🚔',
  reputation: '⭐',
  crew: '👥',
  business: '🏢',
  property: '🏠',
  travel: '✈',
  mission: '🎯',
  supplier: '⚡',
  contract: '◉',
  intel: '🕵',
  finance: '📊',
  storage: '📦',
  market: '📈',
  upgrade: '⬆',
  store: '✦',
  rank: '🏅',
  news: '📰',
  warning: '⚠',
  success: '✓',
  empty: '◌',
} as const;

export type AppIconKey = keyof typeof AppIcons;
