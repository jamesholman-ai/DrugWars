import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameNavFooter } from '../components/GameNavFooter';
import { TutorialOverlay } from '../components/TutorialOverlay';
import {
  AAACommandShell,
  AAAHeroBanner,
  AAAEnterMarketButton,
  AAAFinanceRow,
  AAAStatusPanel,
  AAAActivityStrip,
  AAAFooterActions,
  AAAButton,
  WorldEventImageCard,
  SmartImageBackground,
} from '../components/aaa';
import { FIT_PRESETS } from '../components/aaa/imageFit';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import { getCurrentRank } from '../game/progression';
import { AREA_MAP, getPlayerAreaKey } from '../data/locations';
import { RootStackParamList } from '../types/game';
import { buildCityNewsFeed, getTopPriceMover } from '../game/cityNewsSystem';
import { getTopActiveIntel, formatIntelSource } from '../game/intelSystem';
import { isTutorialActive } from '../game/tutorialSystem';
import { cityNewsToIntelLines } from '../components/premium/CommandIntelCard';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';
import { getCityMaster } from '../assets/imageRegistry';
import { preloadCityArtBundle } from '../assets/imagePreload';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ navigation }: Props) {
  const {
    gameState,
    isStorageReady,
    isEventPopupVisible,
    rest,
    stay,
    advanceTutorial,
    skipTutorial,
    endGame,
  } = useGame();

  useEffect(() => {
    if (!isStorageReady || gameState) return;
    const timeout = setTimeout(() => navigation.replace('Home'), 200);
    return () => clearTimeout(timeout);
  }, [gameState, isStorageReady, navigation]);

  useEffect(() => {
    if (!gameState) return;
    void preloadCityArtBundle(
      gameState.player.currentCityId,
      gameState.player.currentAreaId,
      gameState.player.day
    );
  }, [gameState?.player.currentCityId, gameState?.player.currentAreaId, gameState?.player.day]);

  const activityItems = useMemo(() => {
    if (!gameState || isEventPopupVisible) return [];
    const feed = buildCityNewsFeed(gameState, { cityId: gameState.player.currentCityId });
    const items = cityNewsToIntelLines(feed, 1).map((line) => ({
      id: line.id,
      label: line.label,
      message: line.message,
      tone: line.tone === 'urgent' ? ('urgent' as const) : line.tone === 'good' ? ('good' as const) : ('neutral' as const),
    }));

    if (gameState.lastMessage) {
      items.push({
        id: 'last_action',
        label: 'LAST ACTION',
        message: gameState.lastMessage,
        tone: 'neutral' as const,
      });
    }

    const mover = getTopPriceMover(gameState, getPlayerAreaKey(gameState.player));
    if (mover && items.length < 2) {
      items.push({
        id: 'price_mover',
        label: 'OPPORTUNITIES',
        message: `${mover.name} ${mover.deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(mover.deltaPct)}%`,
        tone: mover.deltaPct >= 0 ? ('good' as const) : ('urgent' as const),
      });
    }

    const topIntel = getTopActiveIntel(gameState, 3);
    for (const intel of topIntel) {
      if (items.length >= 3) break;
      items.unshift({
        id: `intel_${intel.id}`,
        label: formatIntelSource(intel).toUpperCase(),
        message: intel.message,
        tone: 'neutral' as const,
      });
    }

    return items.slice(0, 3);
  }, [gameState, isEventPopupVisible]);

  if (!gameState) {
    const loadingArt = getCityMaster('new_york');
    const loadingPreset = FIT_PRESETS.loading;
    return (
      <AAACommandShell scroll={false}>
        <View style={styles.loadingWrap}>
          <SmartImageBackground
            source={loadingArt.source}
            resizeMode="cover"
            focalPoint="center"
            sourceAspectRatio={loadingArt.aspectRatio}
            sourceNativeWidth={loadingArt.nativeWidth}
            overlay={loadingPreset.overlay}
            overlayStrength={loadingPreset.overlayStrength}
            fill
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.loading}>Preparing your run...</Text>
        </View>
      </AAACommandShell>
    );
  }

  const { player, activeWorldEvents } = gameState;
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const rank = getCurrentRank(gameState);
  const rankProgress = computeRankProgressPercent(gameState);
  const areaDef = AREA_MAP[player.currentAreaId];
  const healCost = areaDef?.healCost ?? 200;
  const canRest = player.health < 100 && player.cash >= healCost;
  const showTutorial = isTutorialActive(gameState);
  const topWorldEvent = (activeWorldEvents ?? [])[0];

  if (player.isGameOver) {
    return (
      <AAACommandShell>
        <Text style={styles.gameOverTitle}>Run Over</Text>
        <Text style={styles.gameOverSub}>{player.gameOverReason}</Text>
        <AAAButton
          label="New Run"
          variant="gold"
          onPress={() => {
            endGame();
            navigation.replace('Home');
          }}
          fullWidth
        />
      </AAACommandShell>
    );
  }

  return (
    <>
      <AAACommandShell footer={<GameNavFooter navigation={navigation} active="Command" />}>
        <AAAHeroBanner
          cityId={player.currentCityId}
          areaId={player.currentAreaId}
          day={player.day}
          rankName={rank.name}
          rankProgress={rankProgress}
          onLocationPress={() => navigation.navigate('Travel', { focus: 'area' })}
        />

        <AAAFinanceRow
          cash={player.cash}
          debt={player.debt}
          netWorth={netWorth}
          onCashPress={() => navigation.navigate('Finance')}
          onDebtPress={() => navigation.navigate('Finance')}
          onNetWorthPress={() => navigation.navigate('Finance')}
        />

        <AAAStatusPanel
          health={player.health}
          heat={player.heat}
          reputation={player.reputation}
        />

        {topWorldEvent ? (
          <WorldEventImageCard
            compact
            eventType={topWorldEvent.type}
            title={topWorldEvent.title}
            tag="WORLD EVENT"
            onPress={() => navigation.navigate('Intel')}
          />
        ) : null}

        <AAAActivityStrip
          items={activityItems}
          onPressItem={() => navigation.navigate('Intel')}
        />

        <AAAEnterMarketButton
          onPress={() => navigation.navigate('Market')}
          disabled={player.isGameOver || isEventPopupVisible}
        />

        <AAAFooterActions
          actions={[
            {
              id: 'stay',
              label: 'STAY HERE',
              icon: 'stay',
              onPress: stay,
              disabled: player.isGameOver || isEventPopupVisible,
            },
            {
              id: 'area',
              label: 'MOVE AREA',
              icon: 'location',
              onPress: () => navigation.navigate('Travel', { focus: 'area' }),
              disabled: player.isGameOver || isEventPopupVisible,
            },
            {
              id: 'city',
              label: 'TRAVEL CITY',
              icon: 'travel',
              onPress: () => navigation.navigate('Travel', { focus: 'city' }),
              disabled: player.isGameOver || isEventPopupVisible,
            },
            {
              id: 'rest',
              label: 'REST',
              icon: 'rest',
              onPress: rest,
              disabled: !canRest || player.isGameOver || isEventPopupVisible,
            },
          ]}
        />
      </AAACommandShell>

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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: palette.bg,
  },
  loading: {
    color: palette.gold,
    textAlign: 'center',
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 1,
    zIndex: 1,
  },
  gameOverTitle: {
    color: palette.danger,
    fontSize: typography.title,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  gameOverSub: {
    color: palette.textSecondary,
    marginBottom: spacing.lg,
  },
});
