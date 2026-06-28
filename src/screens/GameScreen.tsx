import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { EventModal } from '../components/EventModal';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, ScreenHeader, SectionCard } from '../components/ui';
import { TutorialOverlay } from '../components/TutorialOverlay';
import {
  ActionFeedback,
  CommandIntelCard,
  CommandStatGrid,
  EmpireSummaryFooter,
  HubCommandHeader,
  QuickActionsGrid,
  ReputationBadge,
  SkeletonShimmer,
  WhatsNextCard,
  cityNewsToIntelLines,
  inferActionFeedback,
} from '../components/premium';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import { getCurrentRank } from '../game/progression';
import { AREA_MAP, getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { GAME_DISCLAIMER } from '../data/commodities';
import { getDailyPayroll } from '../game/crewBonuses';
import { getDailySafehouseUpkeep } from '../game/safehouseSystem';
import { getTotalBusinessUpkeep } from '../game/businessSystem';
import { getPortfolioSummary } from '../game/businessManagementSystem';
import { getNextActionSuggestion } from '../game/commandSuggestions';
import { buildCityNewsFeed, getTopPriceMover } from '../game/cityNewsSystem';
import { getTopActiveIntel, formatIntelSource } from '../game/intelSystem';
import { isTutorialActive } from '../game/tutorialSystem';
import { getReputationFlavor } from '../data/reputationFlavor';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { AppIcons } from '../theme/icons';
import { fonts, palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ navigation }: Props) {
  const {
    gameState,
    isStorageReady,
    rest,
    stay,
    resolveEventChoice,
    advanceTutorial,
    skipTutorial,
    endGame,
  } = useGame();

  useEffect(() => {
    if (!isStorageReady || gameState) return;
    const timeout = setTimeout(() => navigation.replace('Home'), 200);
    return () => clearTimeout(timeout);
  }, [gameState, isStorageReady, navigation]);

  const suggestion = useMemo(
    () => (gameState ? getNextActionSuggestion(gameState) : null),
    [gameState]
  );

  const intelLines = useMemo(() => {
    if (!gameState) return [];
    const news = cityNewsToIntelLines(
      buildCityNewsFeed(gameState, { cityId: gameState.player.currentCityId }),
      2
    );
    const topIntel = getTopActiveIntel(gameState);
    if (topIntel) {
      news.unshift({
        id: `intel_${topIntel.id}`,
        label: formatIntelSource(topIntel).toUpperCase(),
        message: topIntel.message,
        tone: 'good',
      });
    }
    const mover = getTopPriceMover(gameState, getPlayerAreaKey(gameState.player));
    if (mover && news.length < 3) {
      news.push({
        id: 'price_mover',
        label: 'MARKET',
        message: `${mover.name} ${mover.deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(mover.deltaPct)}% locally`,
        tone: mover.deltaPct >= 0 ? 'good' : 'urgent',
      });
    }
    return news.slice(0, 3);
  }, [gameState]);

  if (!gameState) {
    return (
      <AppShell scroll={false}>
        <SkeletonShimmer lines={3} height={88} />
        <Text style={styles.loadingText}>Preparing your run...</Text>
      </AppShell>
    );
  }

  const { player, pendingEvent, lastMessage, activeWorldEvents } = gameState;
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const rank = getCurrentRank(gameState);
  const rankProgress = computeRankProgressPercent(gameState);
  const repFlavor = getReputationFlavor(player.reputation);
  const actionFeedback = inferActionFeedback(lastMessage);
  const showTutorial = isTutorialActive(gameState);
  const portfolio = getPortfolioSummary(gameState);
  const payroll = getDailyPayroll(gameState);
  const propertyUpkeep = getDailySafehouseUpkeep(gameState);
  const businessUpkeep = getTotalBusinessUpkeep(gameState);
  const dailyNet = portfolio.income - payroll - propertyUpkeep - businessUpkeep;
  const areaDef = AREA_MAP[player.currentAreaId];
  const healCost = areaDef?.healCost ?? 200;
  const canRest = player.health < 100 && player.cash >= healCost;

  if (player.isGameOver) {
    return (
      <AppShell header={<ScreenHeader title="Run Over" day={player.day} />}>
        <SectionCard title="Run Over" tone="red" subtitle={player.gameOverReason}>
          <Text style={styles.line}>Days survived: {player.day}</Text>
          <Text style={styles.line}>Net worth: {formatMoney(netWorth)}</Text>
          <Text style={styles.line}>Reputation: {player.reputation}/100</Text>
        </SectionCard>
        <GameButton
          label="NEW RUN"
          size="lg"
          onPress={() => {
            endGame();
            navigation.replace('Home');
          }}
        />
      </AppShell>
    );
  }

  const quickActions = [
    { id: 'market', label: 'Market', icon: AppIcons.market, onPress: () => navigation.navigate('Market') },
    { id: 'travel', label: 'Travel', icon: AppIcons.travel, onPress: () => navigation.navigate('Travel') },
    { id: 'finance', label: 'Finance', icon: AppIcons.finance, onPress: () => navigation.navigate('Finance') },
    { id: 'ops', label: 'Operations', icon: AppIcons.mission, onPress: () => navigation.navigate('OperationsDashboard') },
    { id: 'empire', label: 'Empire', icon: AppIcons.crew, onPress: () => navigation.navigate('EmpireDashboard') },
    { id: 'store', label: 'Store', icon: AppIcons.store, onPress: () => navigation.navigate('Store') },
  ];

  return (
    <>
      <AppShell
        background="hub"
        header={
          <ScreenHeader
            title="Command"
            subtitle={getAreaLabel(player.currentCityId, player.currentAreaId)}
            day={player.day}
            location={getAreaLabel(player.currentCityId, player.currentAreaId)}
            onLocationPress={() => navigation.navigate('Travel')}
            rank={rank.name}
            rankProgress={rankProgress}
          />
        }
        bottomNav={<GameNavFooter navigation={navigation} active="Command" />}
      >
        <HubCommandHeader
          cityId={player.currentCityId}
          areaId={player.currentAreaId}
          day={player.day}
          rankName={rank.name}
        />

        <ReputationBadge reputation={player.reputation} compact />

        {actionFeedback ? (
          <ActionFeedback
            title={actionFeedback.title}
            message={actionFeedback.message}
            kind={actionFeedback.kind}
          />
        ) : null}

        <CommandStatGrid
          cash={player.cash}
          heat={player.heat}
          reputation={player.reputation}
          netWorth={netWorth}
          reputationTitle={repFlavor.streetName}
          onCashPress={() => navigation.navigate('Finance')}
          onHeatPress={() => navigation.navigate('EmpireDashboard')}
          onReputationPress={() => navigation.navigate('Progress')}
          onNetWorthPress={() => navigation.navigate('Finance')}
        />

        {suggestion ? (
          <WhatsNextCard
            suggestion={suggestion}
            onAction={() => {
              if (suggestion.route === 'Game' && showTutorial) {
                advanceTutorial();
                return;
              }
              navigation.navigate(suggestion.route as never);
            }}
          />
        ) : null}

        <CommandIntelCard
          lines={intelLines}
          onViewAll={() => navigation.navigate('Intel')}
        />

        <QuickActionsGrid actions={quickActions} />

        <SectionCard title="Day Control" tone="neutral" subtitle="Advance time or recover">
          <View style={styles.dayRow}>
            <GameButton
              label={canRest ? `Rest ${formatMoney(healCost)}` : 'Rest — N/A'}
              size="sm"
              variant="secondary"
              disabled={!canRest}
              onPress={rest}
              style={styles.dayBtn}
            />
            <GameButton
              label="Stay — +1 Day"
              size="sm"
              variant="primary"
              onPress={stay}
              style={styles.dayBtn}
            />
          </View>
        </SectionCard>

        {player.legalStatus !== 'clean' ? (
          <EventBanner
            label="Legal Status"
            message={player.legalStatus.replace(/_/g, ' ').toUpperCase()}
            tone="purple"
          />
        ) : null}

        {(activeWorldEvents ?? []).length > 0 ? (
          <EventBanner
            label="World Event"
            message={(activeWorldEvents ?? [])[0]?.title ?? 'Market conditions shifting'}
            tone="amber"
          />
        ) : null}

        <EmpireSummaryFooter
          crewCount={(gameState.hiredCrew ?? []).filter((c) => c.status === 'hired').length}
          businessCount={(gameState.ownedBusinesses ?? []).length}
          propertyCount={(gameState.ownedSafehouses ?? []).length}
          dailyNet={dailyNet}
          onPress={() => navigation.navigate('EmpireDashboard')}
        />

        <Text style={styles.disclaimer}>{GAME_DISCLAIMER}</Text>
      </AppShell>

      <EventModal event={pendingEvent} onChoice={(choiceId) => resolveEventChoice(choiceId)} />

      <TutorialOverlay
        visible={showTutorial}
        step={gameState.tutorial?.step ?? 0}
        onNext={advanceTutorial}
        onSkip={skipTutorial}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  line: {
    color: palette.textSecondary,
    fontSize: typography.body,
    marginBottom: 4,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayBtn: {
    flex: 1,
  },
  disclaimer: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 14,
  },
});
