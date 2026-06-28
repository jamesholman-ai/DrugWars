import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { PressableCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { AppIcons } from '../theme/icons';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MoreScreen'>;

interface MenuItem {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  route: keyof RootStackParamList;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Finance & Intel',
    items: [
      { id: 'finance', label: 'Finance', subtitle: 'Cash, debt, daily costs', icon: AppIcons.finance, route: 'Finance' },
      { id: 'intel', label: 'Intel & News', subtitle: 'Street tips and city wire', icon: AppIcons.intel, route: 'Intel' },
      { id: 'status', label: 'Status', subtitle: 'Rank, progression, stats', icon: AppIcons.rank, route: 'Progress' },
    ],
  },
  {
    title: 'Network & Gear',
    items: [
      { id: 'store', label: 'Store', subtitle: 'Credits and packs', icon: AppIcons.store, route: 'Store' },
      { id: 'contacts', label: 'Contacts', subtitle: 'Buyers and connects', icon: '👤', route: 'Contacts' },
      { id: 'upgrades', label: 'Upgrades', subtitle: 'Equipment and perks', icon: AppIcons.upgrade, route: 'Upgrades' },
    ],
  },
  {
    title: 'World & Info',
    items: [
      { id: 'travel', label: 'Travel', subtitle: 'Cities and districts', icon: AppIcons.travel, route: 'Travel' },
      { id: 'about', label: 'About & Privacy', subtitle: 'Game info and disclaimer', icon: 'ℹ', route: 'About' },
    ],
  },
];

export function MoreScreen({ navigation }: Props) {
  const { gameState } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player } = gameState;
  const rank = getCurrentRank(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="More"
          subtitle="Advanced systems"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="More" />}
    >
      {SECTIONS.map((section) => (
        <SectionCard key={section.title} title={section.title} tone="neutral">
          {section.items.map((item) => (
            <PressableCard
              key={item.id}
              onPress={() => navigation.navigate(item.route as never)}
              style={styles.itemWrap}
              accessibilityLabel={item.label}
            >
              <View style={styles.item}>
                <Text style={styles.icon}>{item.icon}</Text>
                <View style={styles.itemBody}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </PressableCard>
          ))}
        </SectionCard>
      ))}

      <Text style={styles.hint}>All legacy screens remain available through these menus.</Text>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  itemWrap: { marginBottom: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  icon: { fontSize: 22, width: 28, textAlign: 'center' },
  itemBody: { flex: 1 },
  itemLabel: { color: palette.text, fontSize: typography.body, fontWeight: '800' },
  itemSub: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 2 },
  chevron: { color: palette.textMuted, fontSize: 22, fontWeight: '300' },
  hint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});
