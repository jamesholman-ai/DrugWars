/**
 * Professional vector icon system — no emoji in UI.
 * Uses @expo/vector-icons (bundled with Expo).
 */
import React, { memo } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from './theme';

export type IconName =
  | 'cash'
  | 'heat'
  | 'reputation'
  | 'netWorth'
  | 'dailyNet'
  | 'market'
  | 'travel'
  | 'finance'
  | 'operations'
  | 'empire'
  | 'store'
  | 'rank'
  | 'debt'
  | 'dirty'
  | 'clean'
  | 'property'
  | 'business'
  | 'crew'
  | 'intel'
  | 'mission'
  | 'storage'
  | 'upgrade'
  | 'warning'
  | 'success'
  | 'menu'
  | 'location'
  | 'rest'
  | 'stay'
  | 'buy'
  | 'sell'
  | 'trendUp'
  | 'trendDown'
  | 'trendFlat'
  | 'lock'
  | 'guard'
  | 'news'
  | 'contacts'
  | 'about';

type IconDef = {
  family: 'ion' | 'mci';
  name: string;
};

const ICON_MAP: Record<IconName, IconDef> = {
  cash: { family: 'ion', name: 'cash-outline' },
  heat: { family: 'ion', name: 'flame' },
  reputation: { family: 'ion', name: 'star' },
  netWorth: { family: 'ion', name: 'wallet-outline' },
  dailyNet: { family: 'ion', name: 'trending-up' },
  market: { family: 'mci', name: 'chart-line' },
  travel: { family: 'ion', name: 'airplane' },
  finance: { family: 'ion', name: 'pie-chart-outline' },
  operations: { family: 'mci', name: 'crosshairs-gps' },
  empire: { family: 'ion', name: 'people' },
  store: { family: 'ion', name: 'bag-handle-outline' },
  rank: { family: 'ion', name: 'ribbon' },
  debt: { family: 'ion', name: 'lock-closed' },
  dirty: { family: 'ion', name: 'skull-outline' },
  clean: { family: 'ion', name: 'sparkles' },
  property: { family: 'mci', name: 'home-city' },
  business: { family: 'mci', name: 'office-building' },
  crew: { family: 'ion', name: 'people-circle' },
  intel: { family: 'ion', name: 'eye' },
  mission: { family: 'ion', name: 'flag' },
  storage: { family: 'ion', name: 'cube-outline' },
  upgrade: { family: 'mci', name: 'trending-up' },
  warning: { family: 'ion', name: 'warning' },
  success: { family: 'ion', name: 'checkmark-circle' },
  menu: { family: 'ion', name: 'menu' },
  location: { family: 'ion', name: 'location' },
  rest: { family: 'ion', name: 'bed-outline' },
  stay: { family: 'ion', name: 'sunny-outline' },
  buy: { family: 'ion', name: 'add-circle' },
  sell: { family: 'ion', name: 'remove-circle' },
  trendUp: { family: 'ion', name: 'caret-up' },
  trendDown: { family: 'ion', name: 'caret-down' },
  trendFlat: { family: 'ion', name: 'remove' },
  lock: { family: 'ion', name: 'lock-closed' },
  guard: { family: 'mci', name: 'shield-account' },
  news: { family: 'ion', name: 'newspaper-outline' },
  contacts: { family: 'mci', name: 'account-group' },
  about: { family: 'ion', name: 'information-circle-outline' },
};

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

function AppIconInner({ name, size = 20, color = palette.text, style }: AppIconProps) {
  const def = ICON_MAP[name];
  if (def.family === 'mci') {
    return (
      <MaterialCommunityIcons
        name={def.name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
        style={style}
      />
    );
  }
  return (
    <Ionicons
      name={def.name as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
      style={style}
    />
  );
}

export const AppIcon = memo(AppIconInner);

export function isIconName(value: string): value is IconName {
  return value in ICON_MAP;
}

/** Legacy string keys for gradual migration — returns icon name, not emoji */
export const AppIcons = {
  money: 'cash' as IconName,
  dirty: 'dirty' as IconName,
  clean: 'clean' as IconName,
  debt: 'debt' as IconName,
  netWorth: 'netWorth' as IconName,
  heat: 'heat' as IconName,
  police: 'warning' as IconName,
  reputation: 'reputation' as IconName,
  crew: 'crew' as IconName,
  business: 'business' as IconName,
  property: 'property' as IconName,
  travel: 'travel' as IconName,
  mission: 'mission' as IconName,
  supplier: 'operations' as IconName,
  contract: 'mission' as IconName,
  intel: 'news' as IconName,
  finance: 'netWorth' as IconName,
  storage: 'storage' as IconName,
  market: 'market' as IconName,
  upgrade: 'upgrade' as IconName,
  store: 'store' as IconName,
  rank: 'rank' as IconName,
  news: 'news' as IconName,
  warning: 'warning' as IconName,
  success: 'success' as IconName,
  empty: 'storage' as IconName,
  contacts: 'contacts' as IconName,
  about: 'about' as IconName,
} as const;
