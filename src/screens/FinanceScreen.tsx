import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { FinanceAmountModal } from '../components/FinanceAmountModal';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { CityNewsFeed, ReputationBadge, ActionFeedback, inferActionFeedback, SectionHeader, AnimatedMoney } from '../components/premium';
import { AppIcons } from '../theme/icons';
import { buildCityNewsFeed } from '../game/cityNewsSystem';
import { useGame } from '../game/GameContext';
import { BORROW_AMOUNTS, getMaxBorrow } from '../game/engine';
import { getNetWorth } from '../game/economy';
import { getDailyPayroll } from '../game/crewBonuses';
import { getDailySafehouseUpkeep } from '../game/safehouseSystem';
import { getPortfolioSummary } from '../game/businessManagementSystem';
import {
  getEffectiveDebtInterestRate,
  getNextDayInterest,
} from '../game/financeSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { FINANCE_LOG_KIND_LABELS } from '../types/finance';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Finance'>;

function StatRow({
  label,
  value,
  tone,
  numericValue,
}: {
  label: string;
  value: string;
  tone?: string;
  numericValue?: number;
}) {
  return (
    <View style={styles.statRow} accessibilityLabel={`${label} ${value}`}>
      <Text style={styles.statLabel}>{label}</Text>
      {numericValue != null ? (
        <AnimatedMoney
          value={numericValue}
          tone={tone === palette.purpleBright ? 'purple' : tone === palette.neon ? 'green' : 'green'}
          style={styles.statValueAnimated}
        />
      ) : (
        <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
      )}
    </View>
  );
}

export function FinanceScreen({ navigation }: Props) {
  const { gameState, payOffDebt, borrow } = useGame();
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, progression, lastDaySummary, financeLog } = gameState;
  const rank = getCurrentRank(gameState);
  const dirtyCash = player.dirtyCash ?? 0;
  const cleanCash = player.cleanCash ?? 0;
  const maxPay = Math.min(player.cash, player.debt);
  const maxBorrow = getMaxBorrow(player);
  const interestRate = getEffectiveDebtInterestRate(gameState);
  const nextInterest = getNextDayInterest(gameState);
  const payroll = getDailyPayroll(gameState);
  const propertyUpkeep = getDailySafehouseUpkeep(gameState);
  const portfolio = getPortfolioSummary(gameState);
  const businessIncome = portfolio.income;
  const businessUpkeep = portfolio.upkeep;
  const launderCap = portfolio.launder;
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const cityNews = buildCityNewsFeed(gameState);
  const actionFeedback = inferActionFeedback(gameState.lastMessage);

  const payPreset = (amount: number) => {
    if (amount > 0) payOffDebt(amount);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Finance"
          subtitle="Cash · debt · daily costs"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="More" />}
    >
      <ActionMessage message={gameState.lastMessage} />

      {actionFeedback ? (
        <ActionFeedback
          title={actionFeedback.title}
          message={actionFeedback.message}
          kind={actionFeedback.kind}
        />
      ) : null}

      <ReputationBadge reputation={player.reputation} />

      <SectionCard title="City News" subtitle="Market · empire · finance wire" tone="cyan">
        <CityNewsFeed entries={cityNews} maxItems={5} />
      </SectionCard>

      <SectionHeader title="Banking Dashboard" subtitle="Balances · debt · cash flow" />

      <View style={styles.moneyRow}>
        <MoneyCard label="Available" amount={formatMoney(player.cash)} amountValue={player.cash} tone="green" icon={AppIcons.money} />
        <MoneyCard label="Debt" amount={formatMoney(player.debt)} amountValue={player.debt} tone="red" icon={AppIcons.debt} />
      </View>
      <View style={styles.moneyRow}>
        <MoneyCard label="Dirty" amount={formatMoney(dirtyCash)} amountValue={dirtyCash} tone="amber" icon={AppIcons.dirty} />
        <MoneyCard label="Clean" amount={formatMoney(cleanCash)} amountValue={cleanCash} tone="cyan" icon={AppIcons.clean} />
      </View>

      <SectionCard title="Overview" tone="purple">
        <StatRow label="Net worth" value={formatMoney(netWorth)} tone={palette.purpleBright} numericValue={netWorth} />
        <StatRow
          label="Lifetime profit"
          value={formatMoney(progression.lifetimeProfit)}
          tone={palette.neon}
        />
        <StatRow
          label="Daily interest rate"
          value={`${(interestRate * 100).toFixed(2)}%`}
        />
        <StatRow
          label="Interest due next day"
          value={nextInterest > 0 ? formatMoney(nextInterest) : '—'}
          tone={nextInterest > 0 ? palette.danger : palette.textMuted}
        />
      </SectionCard>

      <SectionCard title="Business Empire" subtitle={`Net ${formatMoney(portfolio.income - portfolio.upkeep)}/day · ${portfolio.count} front(s)`}>
        <StatRow label="Gross income / day" value={formatMoney(portfolio.income)} tone={palette.neon} />
        <StatRow label="Business upkeep / day" value={formatMoney(portfolio.upkeep)} />
        <StatRow label="Laundering / day" value={formatMoney(portfolio.launder)} />
        <StatRow label="Avg front heat" value={String(portfolio.heat)} />
      </SectionCard>

      <SectionCard title="Daily Costs & Income" subtitle="Applied when the day advances">
        <StatRow label="Business income / day" value={formatMoney(businessIncome)} tone={palette.neon} />
        <StatRow label="Payroll / day" value={formatMoney(payroll)} />
        <StatRow label="Business upkeep / day" value={formatMoney(businessUpkeep)} />
        <StatRow label="Property upkeep / day" value={formatMoney(propertyUpkeep)} />
        <StatRow label="Laundering capacity / day" value={formatMoney(launderCap)} />
      </SectionCard>

      {lastDaySummary ? (
        <SectionCard title={`Last Day Summary — Day ${lastDaySummary.day}`} tone="amber">
          <StatRow label="Business income" value={formatMoney(lastDaySummary.businessIncome)} />
          <StatRow label="Business upkeep" value={formatMoney(lastDaySummary.businessUpkeep)} />
          <StatRow label="Payroll" value={formatMoney(lastDaySummary.payroll)} />
          <StatRow label="Property upkeep" value={formatMoney(lastDaySummary.safehouseUpkeep)} />
          <StatRow label="Laundered" value={formatMoney(lastDaySummary.laundered)} />
          {lastDaySummary.heatReduced > 0 ? (
            <StatRow label="Heat reduced" value={`−${lastDaySummary.heatReduced}`} />
          ) : null}
          {lastDaySummary.raids.length > 0 ? (
            <Text style={styles.raidNote}>{lastDaySummary.raids.join(' · ')}</Text>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Debt Repayment"
        subtitle={
          player.debt > 0
            ? 'Clean cash spent first, then dirty'
            : 'No outstanding debt'
        }
        tone="green"
      >
        <View style={styles.debtGrid}>
          <GameButton
            label="Custom amount"
            size="sm"
            variant="secondary"
            disabled={maxPay <= 0}
            onPress={() => setCustomOpen(true)}
            style={styles.debtBtn}
          />
          {[100, 500, 1000].map((amount) => (
            <GameButton
              key={amount}
              label={`Pay ${formatMoney(amount)}`}
              size="sm"
              variant="secondary"
              disabled={maxPay < amount}
              onPress={() => payPreset(amount)}
              style={styles.debtBtn}
            />
          ))}
          <GameButton
            label="Pay 25%"
            size="sm"
            variant="secondary"
            disabled={maxPay <= 0}
            onPress={() => payPreset(Math.floor(player.debt * 0.25))}
            style={styles.debtBtn}
          />
          <GameButton
            label="Pay 50%"
            size="sm"
            variant="secondary"
            disabled={maxPay <= 0}
            onPress={() => payPreset(Math.floor(player.debt * 0.5))}
            style={styles.debtBtn}
          />
          <GameButton
            label="Pay all"
            size="sm"
            disabled={maxPay <= 0}
            onPress={() => payPreset(maxPay)}
            style={styles.debtBtn}
          />
        </View>
      </SectionCard>

      {maxBorrow > 0 ? (
        <SectionCard title="Borrow" subtitle={`Max borrow ${formatMoney(maxBorrow)}`}>
          <View style={styles.debtGrid}>
            {BORROW_AMOUNTS.map((amount: number) => (
              <GameButton
                key={amount}
                label={`+${formatMoney(amount)}`}
                size="sm"
                variant="secondary"
                disabled={maxBorrow < amount}
                onPress={() => borrow(amount)}
                style={styles.debtBtn}
              />
            ))}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Recent Activity" subtitle="Last 20 finance events">
        {(financeLog ?? []).length === 0 ? (
          <Text style={styles.emptyLog}>No finance activity yet.</Text>
        ) : (
          (financeLog ?? []).map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <View style={styles.logHeader}>
                <Text style={styles.logKind}>
                  {FINANCE_LOG_KIND_LABELS[entry.kind] ?? entry.kind}
                </Text>
                <Text style={styles.logDay}>Day {entry.day}</Text>
              </View>
              <Text style={styles.logMessage}>{entry.message}</Text>
              {entry.amount > 0 ? (
                <Text style={styles.logAmount}>${entry.amount.toLocaleString()}</Text>
              ) : null}
            </View>
          ))
        )}
      </SectionCard>

      <FinanceAmountModal
        visible={customOpen}
        title="Pay Debt"
        subtitle="Choose how much to pay toward your loan."
        maxAmount={maxPay}
        onClose={() => setCustomOpen(false)}
        onConfirm={(amount) => {
          setCustomOpen(false);
          payPreset(amount);
        }}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  statLabel: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    flex: 1,
  },
  statValue: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'right',
  },
  statValueAnimated: {
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'right',
  },
  debtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  debtBtn: {
    width: '47%',
    flexGrow: 1,
    marginVertical: 0,
  },
  raidNote: {
    color: palette.danger,
    fontSize: typography.caption,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  emptyLog: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  logRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  logKind: {
    color: palette.neon,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logDay: {
    color: palette.textMuted,
    fontSize: 10,
  },
  logMessage: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  logAmount: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
});
