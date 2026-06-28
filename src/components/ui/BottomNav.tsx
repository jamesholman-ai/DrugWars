import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../types/game';
import { MainNavTab, MAIN_NAV_TABS } from '../../navigation/mainNav';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface BottomNavProps {
  active: MainNavTab;
  onNavigate: (route: keyof RootStackParamList) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {MAIN_NAV_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onNavigate(tab.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 0,
    borderRadius: radius.lg,
  },
  tabActive: {
    backgroundColor: palette.neonSoft,
  },
  icon: {
    color: palette.textMuted,
    fontSize: 18,
  },
  label: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: '700',
    marginTop: 2,
  },
  activeIcon: {
    color: palette.neon,
  },
  activeLabel: {
    color: palette.neon,
  },
});

/** @deprecated Use MainNavTab from navigation/mainNav */
export type GameTab = MainNavTab;
