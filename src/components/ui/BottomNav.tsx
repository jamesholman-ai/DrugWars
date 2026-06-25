import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../types/game';
import { fonts, palette, spacing } from '../../theme/theme';

export type GameTab = keyof Pick<
  RootStackParamList,
  'Game' | 'Market' | 'Travel' | 'Inventory' | 'Suppliers' | 'Contracts' | 'Crew' | 'Progress'
>;

const TABS: { id: GameTab; label: string; icon: string }[] = [
  { id: 'Market', label: 'Market', icon: '◈' },
  { id: 'Inventory', label: 'Storage', icon: '▣' },
  { id: 'Crew', label: 'Crew', icon: '☷' },
  { id: 'Contracts', label: 'Deals', icon: '◉' },
  { id: 'Travel', label: 'Travel', icon: '◎' },
  { id: 'Suppliers', label: 'Supply', icon: '⚡' },
  { id: 'Progress', label: 'Status', icon: '◆' },
];

interface BottomNavProps {
  active: GameTab | 'Game';
  onNavigate: (tab: GameTab) => void;
  onHub?: () => void;
}

export function BottomNav({ active, onNavigate, onHub }: BottomNavProps) {
  const resolvedActive = active === 'Game' ? null : active;

  return (
    <View style={styles.bar}>
      <Pressable style={styles.hubBtn} onPress={onHub}>
        <Text style={[styles.hubIcon, active === 'Game' && styles.activeIcon]}>⌂</Text>
        <Text style={[styles.hubLabel, active === 'Game' && styles.activeLabel]}>Hub</Text>
      </Pressable>
      {TABS.map((tab) => {
        const isActive = resolvedActive === tab.id;
        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onNavigate(tab.id)}>
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1}>
              {tab.label}
            </Text>
            {isActive ? <View style={styles.activeDot} /> : null}
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
  hubBtn: {
    flex: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 0,
  },
  icon: {
    color: palette.textMuted,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  hubIcon: {
    color: palette.textMuted,
    fontSize: 18,
    fontFamily: fonts.body,
  },
  label: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  hubLabel: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  activeIcon: {
    color: palette.neon,
  },
  activeLabel: {
    color: palette.neon,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.neon,
    marginTop: 3,
  },
});
