import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, CityNewsFeed } from '../components/premium';
import { buildCityNewsFeed } from '../game/cityNewsSystem';
import { useGame } from '../game/GameContext';
import { useStore } from '../context/StoreContext';
import {
  formatIntelSource,
  getActiveIntel,
  getExpiredIntel,
  getIntelRevealTokenCount,
} from '../game/intelSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { IntelCategory, IntelEntry } from '../types/intel';
import { INTEL_CATEGORY_LABELS } from '../data/intelTemplates';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Intel'>;

function IntelRow({
  entry,
  day,
  expired,
}: {
  entry: IntelEntry;
  day: number;
  expired?: boolean;
}) {
  const daysLeft = Math.max(0, entry.expiresDay - day);
  const category = entry.category;
  const confidence = entry.confidence;
  return (
    <View style={[styles.intelRow, expired && styles.intelRowExpired]}>
      <View style={styles.intelHeader}>
        <View style={styles.badgeRow}>
          {category ? (
            <Text style={styles.categoryBadge}>
              {INTEL_CATEGORY_LABELS[category as IntelCategory] ?? category}
            </Text>
          ) : null}
          {confidence ? (
            <Text style={[styles.confBadge, confidence === 'high' ? styles.confHigh : styles.confLow]}>
              {confidence === 'high' ? 'High confidence' : 'Low confidence'}
            </Text>
          ) : null}
        </View>
        <Text style={styles.intelExpiry}>
          {expired ? 'Expired' : daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft}d`}
        </Text>
      </View>
      <Text style={styles.intelSource}>{formatIntelSource(entry)}</Text>
      <Text style={styles.intelMessage}>{entry.message}</Text>
    </View>
  );
}

export function IntelScreen({ navigation }: Props) {
  const { gameState, revealIntel } = useGame();
  const { profile } = useStore();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage } = gameState;
  const rank = getCurrentRank(gameState);
  const active = getActiveIntel(gameState);
  const expired = getExpiredIntel(gameState).slice(0, 12);
  const tokens = getIntelRevealTokenCount(gameState, profile);
  const cityNews = buildCityNewsFeed(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Intel"
          subtitle="Street tips & market leads"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="More" />}
    >
      <ActionMessage message={lastMessage} />

      <SectionCard title="City News Wire" subtitle="Full local feed" tone="cyan">
        <CityNewsFeed entries={cityNews} maxItems={12} />
      </SectionCard>

      <SectionCard title="Reveal Tokens" tone="purple" subtitle={`${tokens} available`}>
        <Text style={styles.tokenHelp}>
          Spend a token to reveal one hidden lead. Intel Packs from the Store add tokens.
        </Text>
        <GameButton
          label={tokens > 0 ? 'Reveal Intel' : 'No Tokens — Visit Store'}
          size="md"
          disabled={tokens <= 0}
          onPress={() => revealIntel()}
        />
      </SectionCard>

      <SectionCard
        title="Active Intel"
        subtitle={`${active.length} lead${active.length === 1 ? '' : 's'}`}
        tone="green"
      >
        {active.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No active intel"
            message="Get tips from informants, suppliers, crew, travel, or Intel Packs."
          />
        ) : (
          active.map((entry) => (
            <IntelRow key={entry.id} entry={entry} day={player.day} />
          ))
        )}
      </SectionCard>

      {expired.length > 0 ? (
        <SectionCard title="Expired Intel" subtitle="Recent history">
          {expired.map((entry) => (
            <IntelRow key={entry.id} entry={entry} day={player.day} expired />
          ))}
        </SectionCard>
      ) : null}

      <Pressable onPress={() => navigation.navigate('Store')}>
        <Text style={styles.storeLink}>Buy Intel Packs in the Store →</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  tokenHelp: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  intelRow: {
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  intelRowExpired: {
    opacity: 0.65,
  },
  intelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  categoryBadge: {
    color: palette.purpleBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: palette.purpleGlow,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  confBadge: {
    fontSize: 9,
    fontWeight: '700',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confHigh: {
    color: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  confLow: {
    color: palette.amber,
    backgroundColor: palette.amberGlow,
  },
  intelSource: {
    color: palette.cyan,
    fontSize: typography.caption,
    fontWeight: '800',
    marginBottom: 4,
  },
  intelExpiry: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  intelMessage: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 20,
  },
  storeLink: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
