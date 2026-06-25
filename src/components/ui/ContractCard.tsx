import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BuyerContract } from '../../types/contracts';
import { COMMODITY_MAP } from '../../data/commodities';
import { CITY_MAP } from '../../data/locations';
import { AREA_MAP } from '../../data/locations';
import { formatBuyerType, daysUntilDeadline } from '../../game/contractSystem';
import { GameState } from '../../types/game';
import { fonts, palette, radius, spacing } from '../../theme/theme';

interface ContractCardProps {
  contract: BuyerContract;
  state: GameState;
  variant: 'offer' | 'active' | 'history';
  onAccept?: () => void;
  onFulfill?: () => void;
  disabled?: boolean;
}

export function ContractCard({
  contract,
  state,
  variant,
  onAccept,
  onFulfill,
  disabled,
}: ContractCardProps) {
  const drugName = COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug;
  const cityName = CITY_MAP[contract.cityId]?.name ?? contract.cityId;
  const areaName = AREA_MAP[contract.areaId]?.name ?? contract.areaId;
  const daysLeft = daysUntilDeadline(state, contract);
  const isUrgent = variant === 'active' && daysLeft <= 1;
  const atLocation =
    state.player.currentCityId === contract.cityId &&
    state.player.currentAreaId === contract.areaId;

  const statusColor =
    contract.status === 'completed'
      ? palette.neon
      : contract.status === 'failed' || contract.status === 'expired'
        ? palette.danger
        : isUrgent
          ? palette.amber
          : palette.textSecondary;

  return (
    <View style={[styles.card, isUrgent && variant === 'active' && styles.urgent]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.buyerName}>{contract.buyerName}</Text>
          <Text style={styles.buyerType}>{formatBuyerType(contract.buyerType)}</Text>
        </View>
        <View style={styles.payoutBox}>
          <Text style={styles.payoutLabel}>PAY</Text>
          <Text style={styles.payout}>${contract.payout.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.request}>
        Deliver {contract.requestedQuantity}× {drugName}
      </Text>
      <Text style={styles.location}>
        {cityName} · {areaName}
      </Text>

      <View style={styles.metaRow}>
        {variant !== 'history' ? (
          <Text style={[styles.deadline, isUrgent && styles.deadlineUrgent]}>
            {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`} (day {contract.deadlineDay})
          </Text>
        ) : (
          <Text style={[styles.deadline, { color: statusColor }]}>
            {contract.status.toUpperCase()}
          </Text>
        )}
        <Text style={styles.meta}>Rep +{contract.reputationReward}</Text>
        <Text style={styles.meta}>Heat +{contract.heatRisk}</Text>
      </View>

      {variant === 'offer' && onAccept ? (
        <Pressable
          style={[styles.actionBtn, disabled && styles.actionDisabled]}
          disabled={disabled}
          onPress={onAccept}
        >
          <Text style={styles.actionText}>ACCEPT CONTRACT</Text>
        </Pressable>
      ) : null}

      {variant === 'active' && onFulfill ? (
        <Pressable
          style={[
            styles.actionBtn,
            styles.fulfillBtn,
            (disabled || !atLocation) && styles.actionDisabled,
          ]}
          disabled={disabled || !atLocation}
          onPress={onFulfill}
        >
          <Text style={styles.actionText}>
            {atLocation ? 'DELIVER & COLLECT' : 'GO TO DELIVERY SITE'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  urgent: {
    borderColor: palette.amber,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  buyerName: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buyerType: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  payoutBox: { alignItems: 'flex-end' },
  payoutLabel: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  payout: {
    color: palette.neon,
    fontSize: 16,
    fontWeight: '800',
  },
  request: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  location: {
    color: palette.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  deadline: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  deadlineUrgent: {
    color: palette.amber,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 10,
  },
  actionBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.purpleGlow,
    borderWidth: 1,
    borderColor: palette.purpleBright,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  fulfillBtn: {
    backgroundColor: palette.neonSoft,
    borderColor: palette.neonDim,
  },
  actionDisabled: { opacity: 0.45 },
  actionText: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
