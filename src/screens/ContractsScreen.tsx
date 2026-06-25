import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  AppShell,
  ContractCard,
  EventBanner,
  MoneyCard,
  ScreenHeader,
  SectionCard,
} from '../components/ui';
import { useGame } from '../game/GameContext';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { MAX_ACTIVE_CONTRACTS } from '../data/contracts';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Contracts'>;
type Tab = 'offers' | 'active' | 'history';

export function ContractsScreen({ navigation }: Props) {
  const { gameState, acceptContract, fulfillContract } = useGame();
  const [tab, setTab] = useState<Tab>('offers');

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, contractOffers, activeContracts, completedContracts, failedContracts } =
    gameState;
  const rank = getCurrentRank(gameState);
  const offers = (contractOffers ?? []).filter((c) => c.status === 'pending');
  const active = activeContracts ?? [];
  const history = [...(completedContracts ?? []), ...(failedContracts ?? [])].slice(-10).reverse();

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Contracts"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Contracts" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Cash" amount={formatMoney(player.cash)} tone="green" icon="💵" />
        <MoneyCard label="Rep" amount={`${player.reputation}/100`} tone="purple" icon="★" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Buyer Contracts"
        message={`Accept up to ${MAX_ACTIVE_CONTRACTS} active jobs. Deliver on-site before the deadline. City travel advances the day — plan ahead.`}
        tone="amber"
      />

      <View style={styles.tabs}>
        {(['offers', 'active', 'history'] as Tab[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === 'offers' ? `OFFERS (${offers.length})` : key === 'active' ? `ACTIVE (${active.length})` : 'HISTORY'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'offers' ? (
        <SectionCard title="Available Contracts" subtitle="Accept to add to active jobs">
          {offers.length === 0 ? (
            <Text style={styles.empty}>No contract offers right now. Stay put or travel — new buyers appear daily.</Text>
          ) : (
            offers.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                state={gameState}
                variant="offer"
                disabled={player.isGameOver || active.length >= MAX_ACTIVE_CONTRACTS}
                onAccept={() => acceptContract(contract.id)}
              />
            ))
          )}
        </SectionCard>
      ) : null}

      {tab === 'active' ? (
        <SectionCard title="Active Contracts" subtitle="Deliver at the marked location">
          {active.length === 0 ? (
            <Text style={styles.empty}>No active contracts. Check the Offers tab.</Text>
          ) : (
            active.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                state={gameState}
                variant="active"
                disabled={player.isGameOver}
                onFulfill={() => fulfillContract(contract.id)}
              />
            ))
          )}
        </SectionCard>
      ) : null}

      {tab === 'history' ? (
        <SectionCard title="Contract History">
          {history.length === 0 ? (
            <Text style={styles.empty}>No completed or failed contracts yet.</Text>
          ) : (
            history.map((contract) => (
              <ContractCard
                key={`${contract.id}_${contract.status}`}
                contract={contract}
                state={gameState}
                variant="history"
              />
            ))
          )}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
  },
  tabText: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: palette.neon,
  },
  empty: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
});
