import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { ActionMessage } from '../components/ActionMessage';
import { EventModal } from '../components/EventModal';
import { EventLog } from '../components/EventLog';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  ActionCard,
  AppShell,
  EventBanner,
  MoneyCard,
  PlayerMoneyRow,
  ScreenHeader,
  SectionCard,
  StatBar,
  WorldEventTicker,
} from '../components/ui';
import { useGame } from '../game/GameContext';
import { BORROW_AMOUNTS, getMaxBorrow } from '../game/engine';
import { getNetWorth } from '../game/economy';
import { getCurrentRank } from '../game/progression';
import { AREA_MAP, CITY_MAP, getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { COMMODITY_MAP, GAME_DISCLAIMER } from '../data/commodities';
import { daysUntilDeadline } from '../game/contractSystem';
import { getDailyPayroll, getHiredCrewCount } from '../game/crewBonuses';
import { getDailySafehouseUpkeep, getTotalStorageCapacity } from '../game/safehouseSystem';
import {
  getAverageBusinessRisk,
  getTotalBusinessUpkeep,
  getTotalLaunderingCapacity,
  getTotalPassiveIncome,
} from '../game/businessSystem';
import {
  getCurrentStoryMission,
  getDailyProgressLabel,
  getMissionProgressWidgetText,
  getActivePriceTips,
  formatPriceTip,
  formatMissionRewardSummary,
  isStoryCampaignComplete,
} from '../game/missionSystem';
import { MISSION_MAP } from '../data/missions';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { isTutorialActive } from '../game/tutorialSystem';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent, heatLevelLabel } from '../utils/rankProgress';
import { fonts, palette, radius, shadows, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ navigation }: Props) {
  const { gameState, isStorageReady, payOffDebt, borrow, rest, stay, resolveEventChoice, fulfillContract, claimMissionReward, claimDailyObjective, isClaimingReward, advanceTutorial, skipTutorial, endGame } = useGame();

  useEffect(() => {
    if (!isStorageReady || gameState) {
      return;
    }
    const timeout = setTimeout(() => {
      navigation.replace('Home');
    }, 200);
    return () => clearTimeout(timeout);
  }, [gameState, isStorageReady, navigation]);

  const opportunityTip = useMemo(() => {
    if (!gameState) return null;
    const city = CITY_MAP[gameState.player.currentCityId];
    if (!city) return null;
    const cheap = city.specialtyDrugs
      .slice(0, 2)
      .map((id) => COMMODITY_MAP[id]?.name ?? id)
      .join(', ');
    const hot = city.demandDrugs
      .slice(0, 2)
      .map((id) => COMMODITY_MAP[id]?.name ?? id)
      .join(', ');
    if (hot) return `${hot} prices high here — consider selling.`;
    if (cheap) return `${cheap} runs cheap in this city — stock up.`;
    return 'Check the market for price swings.';
  }, [gameState]);

  if (!gameState) {
    return (
      <AppShell scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.neon} size="large" />
          <Text style={styles.loadingText}>Preparing your run...</Text>
        </View>
      </AppShell>
    );
  }

  const { player, pendingEvent, messageLog, lastMessage, activeWorldEvents } = gameState;
  const city = CITY_MAP[player.currentCityId];
  const area = AREA_MAP[player.currentAreaId];
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const maxBorrow = getMaxBorrow(player);
  const payAmount = Math.min(player.cash, player.debt);
  const healCost = area?.healCost ?? 200;
  const canRest = player.health < 100 && player.cash >= healCost;
  const areaKey = getPlayerAreaKey(player);
  const rank = getCurrentRank(gameState);
  const rankProgress = computeRankProgressPercent(gameState);
  const heatLabel = heatLevelLabel(player.heat);
  const activeContracts = gameState.activeContracts ?? [];
  const ownedBusinessCount = (gameState.ownedBusinesses ?? []).length;
  const passiveIncome = getTotalPassiveIncome(gameState);
  const businessUpkeep = getTotalBusinessUpkeep(gameState);
  const launderCap = getTotalLaunderingCapacity(gameState);
  const businessRisk = getAverageBusinessRisk(gameState);
  const dirtyCash = player.dirtyCash ?? 0;
  const cleanCash = player.cleanCash ?? 0;
  const daySummary = gameState.lastDaySummary;
  const storyMission = getCurrentStoryMission(gameState);
  const storyDef = storyMission ? MISSION_MAP[storyMission.id] : undefined;
  const todaysDaily = (gameState.dailyObjectives ?? []).filter((o) => o.generatedDay === player.day);
  const claimableMissions = (gameState.completedMissions ?? []).filter((m) => !m.claimed);
  const priceTips = getActivePriceTips(gameState);
  const showTutorial = isTutorialActive(gameState);
  const tutorialStep = gameState.tutorial?.step ?? 0;
  const showDebtHint = player.day <= 4 && player.debt > 0;
  const storyComplete = isStoryCampaignComplete(gameState);

  if (player.isGameOver) {
    return (
      <AppShell
        header={<ScreenHeader title="Drug Wars Reloaded" day={player.day} />}
      >
        <SectionCard title="Run Over" tone="red" subtitle={player.gameOverReason}>
          <Text style={styles.gameOverLine}>Days survived: {player.day}</Text>
          <Text style={styles.gameOverLine}>Net worth: {formatMoney(netWorth)}</Text>
          <Text style={styles.gameOverLine}>Reputation: {player.reputation}/100</Text>
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

  return (
    <>
      <AppShell
        header={
          <ScreenHeader
            title="Drug Wars Reloaded"
            day={player.day}
            location={getAreaLabel(player.currentCityId, player.currentAreaId)}
            onLocationPress={() => navigation.navigate('Travel')}
            rank={rank.name}
            rankProgress={rankProgress}
          />
        }
        bottomNav={<GameNavFooter navigation={navigation} active="Game" />}
      >
        <PlayerMoneyRow
          availableCash={formatMoney(player.cash)}
          dirtyCash={formatMoney(dirtyCash)}
          cleanCash={formatMoney(cleanCash)}
        />

        <View style={styles.moneyRow}>
          <MoneyCard label="Debt" amount={formatMoney(player.debt)} tone="red" icon="🔒" />
          <MoneyCard label="Net Worth" amount={formatMoney(netWorth)} tone="purple" icon="🏦" />
        </View>

        <View style={styles.empireRow}>
          <Pressable style={styles.empireCard} onPress={() => navigation.navigate('Crew')}>
            <Text style={styles.empireValue}>{getHiredCrewCount(gameState)}</Text>
            <Text style={styles.empireLabel}>CREW</Text>
            <Text style={styles.empireSub}>Payroll {formatMoney(getDailyPayroll(gameState))}/day</Text>
          </Pressable>
          <Pressable style={styles.empireCard} onPress={() => navigation.navigate('Safehouses')}>
            <Text style={styles.empireValue}>{(gameState.ownedSafehouses ?? []).length}</Text>
            <Text style={styles.empireLabel}>PROPERTIES</Text>
            <Text style={styles.empireSub}>
              Storage {getTotalStorageCapacity(gameState)} · Upkeep {formatMoney(getDailySafehouseUpkeep(gameState))}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.businessEmpireCard} onPress={() => navigation.navigate('Businesses')}>
          <View style={styles.businessEmpireHeader}>
            <Text style={styles.empireValue}>{ownedBusinessCount}</Text>
            <Text style={styles.empireLabel}>BUSINESSES</Text>
          </View>
          <Text style={styles.empireSub}>
            Income {formatMoney(passiveIncome)}/day · Launder {formatMoney(launderCap)}/day · Upkeep{' '}
            {formatMoney(businessUpkeep)}
          </Text>
          {businessRisk > 0 ? (
            <Text style={styles.empireSub}>Empire risk {businessRisk}/10</Text>
          ) : null}
        </Pressable>

        {showDebtHint ? (
          <EventBanner
            label="Debt Pressure"
            message={`Shark wants $${player.debt.toLocaleString()} — interest ~2.5%/day when you advance. First goal: make a sale, then pay $500+ from the Hub.`}
            tone="amber"
          />
        ) : null}

        {(storyDef || todaysDaily.length > 0 || claimableMissions.length > 0 || storyComplete) ? (
          <SectionCard
            title="Missions"
            subtitle="Story · Daily · Rewards"
            tone="amber"
          >
            {storyComplete ? (
              <View style={styles.missionRow}>
                <Text style={styles.missionTitle}>STORY COMPLETE</Text>
                <Text style={styles.missionMeta}>
                  Continue growing your empire — rank up, expand cities, and stack businesses.
                </Text>
                <Text style={styles.missionMeta}>More story content coming.</Text>
              </View>
            ) : null}

            {storyDef && storyMission ? (
              <Pressable style={styles.missionRow} onPress={() => navigation.navigate('Missions')}>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>STORY: {storyDef.title}</Text>
                  <Text style={styles.missionMeta} numberOfLines={2}>
                    {storyDef.description}
                  </Text>
                  <Text style={styles.missionProgress}>
                    {getMissionProgressWidgetText(gameState, storyMission)}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {todaysDaily.slice(0, 3).map((obj) => {
              const done = obj.progress >= obj.target;
              const claimKey = `daily:${obj.id}`;
              const claiming = isClaimingReward(claimKey);
              return (
                <View key={obj.id} style={styles.dailyRow}>
                  <View style={styles.missionInfo}>
                    <Text style={styles.dailyTitle}>{obj.title}</Text>
                    <Text style={styles.missionProgress}>
                      {getDailyProgressLabel(obj)}
                    </Text>
                  </View>
                  {obj.claimed ? (
                    <Text style={styles.claimedTag}>CLAIMED</Text>
                  ) : done ? (
                    <Pressable
                      style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
                      onPress={() => claimDailyObjective(obj.id)}
                      disabled={claiming}
                    >
                      <Text style={styles.claimBtnText}>{claiming ? '…' : 'CLAIM'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}

            {claimableMissions.slice(0, 2).map((m) => {
              const def = MISSION_MAP[m.id];
              if (!def) return null;
              const claimKey = `mission:${m.id}`;
              const claiming = isClaimingReward(claimKey);
              return (
                <View key={m.id} style={styles.dailyRow}>
                  <View style={styles.missionInfo}>
                    <Text style={styles.dailyTitle}>{def.title} — reward ready</Text>
                    <Text style={styles.missionProgress}>
                      {formatMissionRewardSummary(def.rewards)}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
                    onPress={() => claimMissionReward(m.id)}
                    disabled={claiming}
                  >
                    <Text style={styles.claimBtnText}>{claiming ? '…' : 'CLAIM'}</Text>
                  </Pressable>
                </View>
              );
            })}

            <Pressable onPress={() => navigation.navigate('Missions')}>
              <Text style={styles.contractLink}>View all missions →</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        {priceTips.length > 0 ? (
          <EventBanner
            label="Intel Tip"
            message={formatPriceTip(priceTips[0])}
            tone="purple"
          />
        ) : null}

        <SectionCard style={styles.statsCard}>
          <StatBar label="Health" value={player.health} color={palette.neon} dangerBelow={25} />
          <StatBar label="Heat" value={player.heat} color={palette.amber} dangerAbove={75} />
          <StatBar label="Reputation" value={player.reputation} color={palette.purpleBright} />
          <View style={styles.heatRow}>
            <Text style={styles.heatLabel}>HEAT LEVEL</Text>
            <Text
              style={[
                styles.heatValue,
                heatLabel === 'High' || heatLabel === 'Critical'
                  ? styles.heatDanger
                  : styles.heatOk,
              ]}
            >
              {heatLabel.toUpperCase()}
            </Text>
          </View>
        </SectionCard>

        {daySummary && daySummary.day === player.day - 1 ? (
          <SectionCard title="Day Summary" subtitle={`End of day ${daySummary.day}`} tone="green">
            {daySummary.payroll > 0 ? (
              <Text style={styles.summaryLine}>Payroll −{formatMoney(daySummary.payroll)}</Text>
            ) : null}
            {daySummary.safehouseUpkeep > 0 ? (
              <Text style={styles.summaryLine}>
                Property upkeep −{formatMoney(daySummary.safehouseUpkeep)}
              </Text>
            ) : null}
            {daySummary.businessIncome > 0 ? (
              <Text style={styles.summaryLine}>
                Business income +{formatMoney(daySummary.businessIncome)} (clean)
              </Text>
            ) : null}
            {daySummary.businessUpkeep > 0 ? (
              <Text style={styles.summaryLine}>
                Business upkeep −{formatMoney(daySummary.businessUpkeep)}
              </Text>
            ) : null}
            {daySummary.laundered > 0 ? (
              <Text style={styles.summaryLine}>
                Laundered {formatMoney(daySummary.laundered)} dirty → clean
              </Text>
            ) : null}
            {daySummary.heatReduced > 0 ? (
              <Text style={styles.summaryLine}>Fronts reduced heat −{daySummary.heatReduced}</Text>
            ) : null}
            {daySummary.raids.map((raid) => (
              <Text key={raid} style={styles.summaryRaid}>
                {raid}
              </Text>
            ))}
          </SectionCard>
        ) : null}

        {opportunityTip ? (
          <ActionCard title="Opportunity" message={opportunityTip} tone="amber" icon="💡" />
        ) : null}

        {activeContracts.length > 0 ? (
          <SectionCard
            title="Active Contracts"
            subtitle={`${activeContracts.length} job(s) in progress`}
            tone="amber"
          >
            {activeContracts.slice(0, 3).map((contract) => {
              const drugName = COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug;
              const daysLeft = daysUntilDeadline(gameState, contract);
              const atSite =
                player.currentCityId === contract.cityId &&
                player.currentAreaId === contract.areaId;
              return (
                <View key={contract.id} style={styles.contractRow}>
                  <View style={styles.contractInfo}>
                    <Text style={styles.contractTitle} numberOfLines={1}>
                      {contract.buyerName}: {contract.requestedQuantity}× {drugName}
                    </Text>
                    <Text style={styles.contractMeta}>
                      ${contract.payout.toLocaleString()} · {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </Text>
                  </View>
                  {atSite ? (
                    <Pressable
                      style={styles.contractDeliver}
                      onPress={() => fulfillContract(contract.id)}
                    >
                      <Text style={styles.contractDeliverText}>DELIVER</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.contractView}
                      onPress={() => navigation.navigate('Contracts')}
                    >
                      <Text style={styles.contractViewText}>VIEW</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            <Pressable onPress={() => navigation.navigate('Contracts')}>
              <Text style={styles.contractLink}>View all contracts →</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        <View style={styles.dealsRow}>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Upgrades')}>
            <Text style={styles.dealBtnIcon}>⬆</Text>
            <Text style={styles.dealBtnLabel}>UPGRADES</Text>
          </Pressable>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.dealBtnIcon}>👤</Text>
            <Text style={styles.dealBtnLabel}>CONTACTS</Text>
          </Pressable>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Suppliers')}>
            <Text style={styles.dealBtnIcon}>⚡</Text>
            <Text style={styles.dealBtnLabel}>SUPPLIERS</Text>
          </Pressable>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Contracts')}>
            <Text style={styles.dealBtnIcon}>◉</Text>
            <Text style={styles.dealBtnLabel}>CONTRACTS</Text>
          </Pressable>
        </View>

        <View style={styles.dealsRow}>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Businesses')}>
            <Text style={styles.dealBtnIcon}>🏢</Text>
            <Text style={styles.dealBtnLabel}>BUSINESS</Text>
          </Pressable>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Missions')}>
            <Text style={styles.dealBtnIcon}>🎯</Text>
            <Text style={styles.dealBtnLabel}>MISSIONS</Text>
          </Pressable>
          <Pressable style={styles.dealBtn} onPress={() => navigation.navigate('Store')}>
            <Text style={styles.dealBtnIcon}>✦</Text>
            <Text style={styles.dealBtnLabel}>STORE</Text>
          </Pressable>
        </View>

        <WorldEventTicker
          events={activeWorldEvents}
          currentDay={player.day}
          currentAreaKey={areaKey}
        />

        {player.legalStatus !== 'clean' ? (
          <EventBanner
            label="Legal Status"
            message={`${player.legalStatus.replace(/_/g, ' ').toUpperCase()}${player.federalCaseSeverity > 0 ? ` · Federal case ${player.federalCaseSeverity}%` : ''}${player.daysInJail > 0 ? ` · ${player.daysInJail} days in jail` : ''}`}
            tone="purple"
          />
        ) : null}

        {lastMessage ? (
          <EventBanner label="Last Action" message={lastMessage} tone="neutral" />
        ) : null}

        <ActionMessage message={lastMessage} />

        <Pressable
          style={styles.marketCta}
          onPress={() => navigation.navigate('Market')}
        >
          <View style={styles.marketGlow} />
          <Text style={styles.marketCtaText}>ENTER MARKET</Text>
        </Pressable>

        <SectionCard title="Street Intel" tone="green" subtitle={city?.name}>
          <Text style={styles.body}>{city?.description}</Text>
          <Text style={styles.areaBody}>{area?.description}</Text>
        </SectionCard>

        <SectionCard title="Finance" subtitle="Loan shark · rest advances day">
          <View style={styles.financeGrid}>
            <GameButton
              label={`PAY ${formatMoney(payAmount)}`}
              size="sm"
              variant="secondary"
              disabled={player.debt <= 0 || player.cash <= 0}
              onPress={() => payOffDebt(player.cash)}
              style={styles.gridBtn}
            />
            {BORROW_AMOUNTS.map((amount) => (
              <GameButton
                key={amount}
                label={`+${formatMoney(amount)}`}
                size="sm"
                variant="secondary"
                disabled={maxBorrow < amount}
                onPress={() => borrow(amount)}
                style={styles.gridBtn}
              />
            ))}
            <GameButton
              label={canRest ? `REST ${formatMoney(healCost)}` : 'REST — N/A'}
              size="sm"
              variant="secondary"
              disabled={!canRest}
              onPress={rest}
              style={styles.gridBtn}
            />
            <GameButton
              label="STAY HERE"
              size="sm"
              variant="secondary"
              onPress={stay}
              style={styles.gridBtn}
            />
          </View>
        </SectionCard>

        <Text style={styles.disclaimer}>{GAME_DISCLAIMER}</Text>

        <SectionCard title="Street Log">
          <EventLog messages={messageLog} maxHeight={180} />
        </SectionCard>

        <GameButton
          label="QUIT TO MENU"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('Home')}
          style={styles.quitBtn}
        />
      </AppShell>

      <EventModal
        event={pendingEvent}
        onChoice={(choiceId) => {
          resolveEventChoice(choiceId);
        }}
      />

      <TutorialOverlay
        visible={showTutorial}
        step={tutorialStep}
        onNext={advanceTutorial}
        onSkip={skipTutorial}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  empireRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  empireCard: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  empireValue: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '800',
  },
  empireLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  empireSub: {
    color: palette.textSecondary,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 12,
  },
  businessEmpireCard: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  businessEmpireHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  summaryLine: {
    color: palette.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  summaryRaid: {
    color: palette.danger,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '700',
  },
  statsCard: {
    paddingBottom: spacing.sm,
  },
  heatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  heatLabel: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heatValue: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heatOk: {
    color: palette.neon,
  },
  heatDanger: {
    color: palette.danger,
  },
  eventMeta: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  marketCta: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neon,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.glowGreen,
  },
  marketGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.neonGlow,
    opacity: 0.4,
  },
  marketCtaText: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  body: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  areaBody: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gridBtn: {
    width: '48%',
    flexGrow: 1,
    marginVertical: 0,
  },
  disclaimer: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    lineHeight: 14,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  quitBtn: {
    marginBottom: spacing.md,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  contractInfo: { flex: 1, minWidth: 0 },
  contractTitle: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  contractMeta: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  contractDeliver: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  contractDeliverText: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
  },
  contractView: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  contractViewText: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  contractLink: {
    color: palette.neon,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  dealsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dealBtn: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  dealBtnIcon: {
    fontSize: 18,
    color: palette.neon,
  },
  dealBtnLabel: {
    color: palette.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  missionRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    marginBottom: spacing.xs,
  },
  missionInfo: { flex: 1, minWidth: 0 },
  missionTitle: {
    color: palette.neon,
    fontSize: 11,
    fontWeight: '800',
  },
  dailyTitle: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
  },
  missionMeta: {
    color: palette.textSecondary,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  missionProgress: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  claimBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  claimBtnDisabled: {
    opacity: 0.4,
  },
  claimBtnText: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
  },
  claimedTag: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gameOverLine: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
  },
});
