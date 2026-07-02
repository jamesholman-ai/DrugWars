import { Platform } from 'react-native';
import { spacing, typography } from '../theme/theme';

/** Matches BottomNav bar styles (padding + icon + label). Excludes safe-area inset. */
export const BOTTOM_NAV_BAR_HEIGHT =
  spacing.sm * 2 + 8 * 2 + 18 + 2 + typography.tiny;

/** Extra breathing room below the last scrollable card. */
export const BOTTOM_NAV_CONTENT_EXTRA = spacing.md;

/**
 * Android 3-button navigation often reports 0 bottom inset.
 * Use a floor so labels are never drawn under system controls.
 */
export function getEffectiveBottomInset(bottomInset: number): number {
  if (Platform.OS !== 'android') {
    return bottomInset;
  }
  return bottomInset > 0 ? bottomInset : 48;
}

/** Scroll content padding when a fixed bottom nav is rendered outside the scroll view. */
export function getScrollContentPaddingBottom(bottomInset: number, hasBottomNav: boolean): number {
  if (hasBottomNav) {
    return BOTTOM_NAV_CONTENT_EXTRA;
  }
  return getEffectiveBottomInset(bottomInset) + BOTTOM_NAV_CONTENT_EXTRA;
}

/** Total fixed footer height including safe area (for diagnostics / manual layouts). */
export function getBottomNavTotalHeight(bottomInset: number): number {
  return BOTTOM_NAV_BAR_HEIGHT + getEffectiveBottomInset(bottomInset);
}
