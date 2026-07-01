import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing, typography } from '../../theme/theme';

export type UpgradeTab = 'business' | 'equipment' | 'vehicles' | 'hideout';

interface AAAUpgradeTabsProps {
  active: UpgradeTab;
  onChange: (tab: UpgradeTab) => void;
  cashLabel: string;
}

const TABS: { id: UpgradeTab; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'hideout', label: 'Hideout' },
];

function AAAUpgradeTabsInner({ active, onChange, cashLabel }: AAAUpgradeTabsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>UPGRADES</Text>
        <Text style={styles.cash}>{cashLabel}</Text>
      </View>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onChange(tab.id)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const AAAUpgradeTabs = memo(AAAUpgradeTabsInner);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cash: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgCard,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: palette.neon,
    fontWeight: '800',
  },
});
