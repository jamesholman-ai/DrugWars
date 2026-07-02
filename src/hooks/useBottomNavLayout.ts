import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BOTTOM_NAV_BAR_HEIGHT,
  BOTTOM_NAV_CONTENT_EXTRA,
  getBottomNavTotalHeight,
  getEffectiveBottomInset,
  getScrollContentPaddingBottom,
} from '../layout/bottomNavLayout';

export function useBottomNavLayout(hasBottomNav = true) {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const bottomInset = getEffectiveBottomInset(insets.bottom);
    const navHeight = BOTTOM_NAV_BAR_HEIGHT;
    const totalNavHeight = getBottomNavTotalHeight(insets.bottom);
    const contentPaddingBottom = getScrollContentPaddingBottom(insets.bottom, hasBottomNav);

    return {
      insets,
      bottomInset,
      navHeight,
      totalNavHeight,
      contentPaddingBottom,
      contentExtra: BOTTOM_NAV_CONTENT_EXTRA,
    };
  }, [hasBottomNav, insets.bottom, insets.top, insets.left, insets.right]);
}
