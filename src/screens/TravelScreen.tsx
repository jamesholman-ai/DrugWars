import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  AAACommandShell,
  BackgroundImageCard,
  CityInfoCard,
} from '../components/aaa';
import { AreaCard, AreaInfoPanel, EventBanner, SectionCard } from '../components/ui';
import { getCityMaster } from '../assets/imageRegistry';
import { preloadCityArt, preloadTravelDestinations } from '../assets/imagePreload';
import { useGame } from '../game/GameContext';
import {
  CITIES,
  CITY_MAP,
  getAreaKey,
  getAreaLabel,
  getAreasForCity,
  getCurrentArea,
  getTravelHubAreaId,
} from '../data/locations';
import { navigateWithLocationIntro } from '../utils/presentationNav';
import { COMMODITY_MAP } from '../data/commodities';
import { AreaId, RootStackParamList } from '../types/game';
import { getActiveWorldEventsForLocation, isTravelBlocked } from '../game/worldEvents';
import { getCityUnlockHint, isCityUnlocked } from '../game/progression';
import {
  AREA_MOVES_BEFORE_DAY_ADVANCE,
  getAreaMovesToday,
} from '../game/financeSystem';
import { getAreaOwnership } from '../game/territory';
import { getMarketPersonality } from '../game/marketAvailabilitySystem';
import { formatCityEmpireLine, getCityEmpireSummary } from '../game/empireSummary';
import { riskFromModifier } from '../utils/rankProgress';
import { AppIcon } from '../theme/icons';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Travel'>;

export function TravelScreen({ navigation, route }: Props) {
  const { gameState, travelToArea, travelToCity, stay } = useGame();
  const focus = route.params?.focus;
  const [citySectionOpen, setCitySectionOpen] = useState(focus === 'city');
  const [expandedCityId, setExpandedCityId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const citySectionY = useRef(0);

  useEffect(() => {
    if (focus === 'city') {
      setCitySectionOpen(true);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: citySectionY.current, animated: true });
      }, 120);
    } else if (focus === 'area') {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [focus]);

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  useEffect(() => {
    if (!gameState) return;
    void preloadTravelDestinations(gameState.player.day);
  }, [gameState]);

  if (!gameState) {
    return null;
  }

  const { player, lastMessage } = gameState;
  const currentCity = CITY_MAP[player.currentCityId];
  const currentArea = getCurrentArea(player);
  const cityAreas = getAreasForCity(player.currentCityId);
  const currentOwner = getAreaOwnership(
    gameState,
    player.currentCityId,
    player.currentAreaId
  );
  const areaMovesToday = getAreaMovesToday(gameState);
  const heroArt = getCityMaster(player.currentCityId);
  const playerAreaKey = getAreaKey(player.currentCityId, player.currentAreaId);
  const localEvents = getActiveWorldEventsForLocation(gameState, playerAreaKey);

  const showIntro = (cityId: string, areaId: string, day: number) => {
    navigateWithLocationIntro(navigation, { cityId, areaId, day, returnTo: 'Game' });
  };

  const handleAreaTravel = (areaId: AreaId) => {
    const next = travelToArea(areaId);
    if (!next || next.player.currentAreaId !== areaId) return;

    const nextDay =
      areaMovesToday + 1 >= AREA_MOVES_BEFORE_DAY_ADVANCE ? player.day + 1 : player.day;
    showIntro(player.currentCityId, areaId, nextDay);
  };

  const handleCityTravel = (cityId: string) => {
    const hub = getTravelHubAreaId(cityId);
    const next = travelToCity(cityId, hub);
    if (!next || next.player.currentCityId !== cityId) return;

    showIntro(cityId, next.player.currentAreaId, next.player.day);
  };

  return (
    <>
      <AAACommandShell
        scrollRef={scrollRef}
        footer={
          <>
            <View style={styles.footer}>
              <GameButton
                label="STAY HERE — advances 1 day"
                size="lg"
                onPress={stay}
                disabled={player.isGameOver}
              />
            </View>
            <GameNavFooter navigation={navigation} active="More" />
          </>
        }
      >
        <Text style={styles.screenTitle}>TRAVEL</Text>
        <Text style={styles.screenSub}>DAY {player.day} · {getAreaLabel(player.currentCityId, player.currentAreaId).toUpperCase()}</Text>

        <ActionMessage message={lastMessage} />

        <BackgroundImageCard
          art={heroArt}
          focalPoint="center"
          overlayStrength={0.35}
          height={132}
        >
          <Text style={styles.hereLabel}>CURRENT LOCATION</Text>
          <Text style={styles.hereCity}>{currentCity?.name ?? player.currentCityId}</Text>
          <Text style={styles.hereArea}>{currentArea?.name ?? player.currentAreaId}</Text>
          {currentArea ? (
            <Text style={styles.hereMeta}>
              Risk {currentArea.riskLevel}/5 · Police {currentArea.policePresence}% · Day {player.day}
            </Text>
          ) : null}
        </BackgroundImageCard>

        {currentArea ? (
          <View style={styles.infoPanel}>
            <AreaInfoPanel area={currentArea} owner={currentOwner} />
            {localEvents[0] ? (
              <EventBanner
                label="Local event"
                message={localEvents[0].title}
                tone="purple"
              />
            ) : null}
          </View>
        ) : null}

        <EventBanner
          label="Travel rules"
          message="Moving areas does not advance the day until your 3rd move. Traveling to another city advances the day."
          tone="amber"
        />

        <SectionCard
          title="Move Within City"
          subtitle={`Area moves today: ${areaMovesToday} / ${AREA_MOVES_BEFORE_DAY_ADVANCE} · ${cityAreas.length} districts`}
        >
          <View style={styles.areaGrid}>
            {cityAreas.map((area) => {
              const isHere = area.id === player.currentAreaId;
              const canAfford = player.cash >= area.travelCost;
              const areaKey = getAreaKey(player.currentCityId, area.id);
              const travelBlock = isTravelBlocked(gameState, areaKey);
              const owner = getAreaOwnership(gameState, player.currentCityId, area.id);
              const disabled =
                isHere || !canAfford || player.isGameOver || travelBlock.blocked;

              return (
                <View key={area.id} style={styles.areaCell}>
                  <AreaCard
                    area={area}
                    owner={owner}
                    isCurrent={isHere}
                    disabled={disabled}
                    blockedReason={travelBlock.blocked ? travelBlock.reason : undefined}
                    marketPersonality={getMarketPersonality(area.id)}
                    areaMovesLabel={`Moves today ${areaMovesToday}/${AREA_MOVES_BEFORE_DAY_ADVANCE}`}
                    onPress={() => handleAreaTravel(area.id as AreaId)}
                  />
                </View>
              );
            })}
          </View>
        </SectionCard>

        <View
          onLayout={(e) => {
            citySectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <Pressable
            style={styles.cityToggle}
            onPress={() => setCitySectionOpen((v) => !v)}
            accessibilityRole="button"
          >
            <AppIcon name="travel" size={16} color={palette.neon} />
            <Text style={styles.cityToggleText}>
              {citySectionOpen ? 'Hide city list' : 'Travel To Another City'}
            </Text>
          </Pressable>

          {citySectionOpen ? (
            <SectionCard title="Travel To Another City" subtitle="Advances day · new market prices">
              {CITIES.map((city) => {
                const isHere = city.id === player.currentCityId;
                const cityLocked = !isCityUnlocked(gameState, city.id);
                const canAfford = player.cash >= city.travelCost;
                const hubAreaId = getTravelHubAreaId(city.id);
                const destKey = getAreaKey(city.id, hubAreaId);
                const hubBlock = isTravelBlocked(gameState, destKey);
                const empire = getCityEmpireSummary(gameState, city.id);
                const expanded = isHere || expandedCityId === city.id;

                const specialtyDrugs = city.specialtyDrugs.map(
                  (id) => COMMODITY_MAP[id]?.name ?? id
                );
                const demandDrugs = city.demandDrugs.map(
                  (id) => COMMODITY_MAP[id]?.name ?? id
                );

                return (
                  <CityInfoCard
                    key={city.id}
                    cityId={city.id}
                    name={city.name}
                    regionLabel={city.description.split('.')[0]}
                    travelCost={city.travelCost}
                    riskLevel={riskFromModifier(city.riskModifier)}
                    specialtyDrugs={specialtyDrugs}
                    demandDrugs={demandDrugs}
                    empireLine={formatCityEmpireLine(empire)}
                    empireHint={empire.hint}
                    isCurrent={isHere}
                    isLocked={cityLocked || hubBlock.blocked}
                    expanded={expanded}
                    onPress={() => setExpandedCityId((current) => (current === city.id ? null : city.id))}
                    onTravel={
                      !isHere && !cityLocked && canAfford && !player.isGameOver && !hubBlock.blocked
                        ? () => handleCityTravel(city.id)
                        : undefined
                    }
                  />
                );
              })}
              {CITIES.some((c) => !isCityUnlocked(gameState, c.id)) ? (
                <Text style={styles.lockHint}>
                  Locked cities:{' '}
                  {CITIES.filter((c) => !isCityUnlocked(gameState, c.id))
                    .map((c) => `${c.name} — ${getCityUnlockHint(c.id)}`)
                    .join(' · ')}
                </Text>
              ) : null}
            </SectionCard>
          ) : null}
        </View>
      </AAACommandShell>
    </>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    color: palette.neon,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 2,
  },
  screenSub: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.bgElevated,
  },
  hereLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hereCity: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '900',
  },
  hereArea: {
    color: palette.gold,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  hereMeta: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 6,
  },
  infoPanel: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  areaCell: {
    width: '47%',
    flexGrow: 1,
  },
  cityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: 12,
    backgroundColor: palette.neonSoft,
  },
  cityToggleText: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
