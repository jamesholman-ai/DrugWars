import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { EventModal } from '../components/EventModal';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  AppShell,
  AreaCard,
  AreaInfoPanel,
  CityCard,
  EventBanner,
  ScreenHeader,
  SectionCard,
} from '../components/ui';
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
import { COMMODITY_MAP } from '../data/commodities';
import { AreaId, RootStackParamList } from '../types/game';
import { isTravelBlocked } from '../game/worldEvents';
import { getCityUnlockHint, getCurrentRank, isCityUnlocked } from '../game/progression';
import {
  AREA_MOVES_BEFORE_DAY_ADVANCE,
  getAreaMovesToday,
} from '../game/financeSystem';
import { getAreaOwnership } from '../game/territory';
import { computeRankProgressPercent, riskFromModifier } from '../utils/rankProgress';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Travel'>;

export function TravelScreen({ navigation }: Props) {
  const { gameState, travelToArea, travelToCity, stay, resolveEventChoice } = useGame();
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  if (!gameState) {
    return null;
  }

  const { player, pendingEvent, lastMessage } = gameState;
  const currentCity = CITY_MAP[player.currentCityId];
  const currentArea = getCurrentArea(player);
  const cityAreas = getAreasForCity(player.currentCityId);
  const currentOwner = getAreaOwnership(
    gameState,
    player.currentCityId,
    player.currentAreaId
  );
  const rank = getCurrentRank(gameState);
  const areaMovesToday = getAreaMovesToday(gameState);

  return (
    <>
      <AppShell
        header={
          <ScreenHeader
            title="Travel"
            day={player.day}
            location={getAreaLabel(player.currentCityId, player.currentAreaId)}
            rank={rank.name}
            rankProgress={computeRankProgressPercent(gameState)}
          />
        }
        bottomNav={<GameNavFooter navigation={navigation} active="More" />}
        footer={
          <View style={styles.footer}>
            <GameButton
              label="STAY HERE — advances 1 day"
              size="lg"
              onPress={stay}
              disabled={player.isGameOver}
            />
          </View>
        }
      >
        <ActionMessage message={lastMessage} />

        <SectionCard title="Current City" tone="green" elevated>
          <Text style={styles.hereCity}>{currentCity?.name ?? player.currentCityId}</Text>
          <Text style={styles.hereArea}>{currentArea?.name ?? player.currentAreaId}</Text>
          {currentArea ? (
            <AreaInfoPanel area={currentArea} owner={currentOwner} />
          ) : null}
        </SectionCard>

        <EventBanner
          label="Travel rules"
          message="Area moves 1–2: same day. 3rd area move advances the day. City travel always advances the day."
          tone="amber"
        />

        <SectionCard
          title="Area Move"
          subtitle={`Area moves today: ${areaMovesToday} / ${AREA_MOVES_BEFORE_DAY_ADVANCE} · 3rd move advances day`}
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
                    onPress={() => travelToArea(area.id as AreaId)}
                  />
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="City Travel" subtitle="Advances day · new market prices">
          {CITIES.map((city) => {
            const isHere = city.id === player.currentCityId;
            const cityLocked = !isCityUnlocked(gameState, city.id);
            const canAfford = player.cash >= city.travelCost;
            const hubAreaId = getTravelHubAreaId(city.id);
            const destKey = getAreaKey(city.id, hubAreaId);
            const hubBlock = isTravelBlocked(gameState, destKey);
            const expanded = expandedCity === city.id;

            const specialtyDrugs = city.specialtyDrugs.map(
              (id) => COMMODITY_MAP[id]?.name ?? id
            );
            const demandDrugs = city.demandDrugs.map(
              (id) => COMMODITY_MAP[id]?.name ?? id
            );

            return (
              <CityCard
                key={city.id}
                name={city.name}
                travelCost={city.travelCost}
                riskLevel={riskFromModifier(city.riskModifier)}
                specialtyDrugs={specialtyDrugs}
                demandDrugs={demandDrugs}
                isCurrent={isHere}
                isLocked={cityLocked || hubBlock.blocked}
                expanded={expanded || isHere}
                onPress={() => {
                  if (cityLocked) return;
                  setExpandedCity(expanded ? null : city.id);
                }}
                onTravel={
                  !isHere && !cityLocked && canAfford && !player.isGameOver && !hubBlock.blocked
                    ? () => travelToCity(city.id)
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
      </AppShell>

      <EventModal
        event={pendingEvent}
        onChoice={(choiceId) => {
          resolveEventChoice(choiceId);
          navigation.navigate('Game');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.bgElevated,
  },
  hereCity: {
    color: palette.neon,
    fontSize: typography.title,
    fontWeight: '800',
  },
  hereArea: {
    color: palette.text,
    fontSize: typography.body,
    marginTop: 4,
    marginBottom: spacing.sm,
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
  lockHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
});
