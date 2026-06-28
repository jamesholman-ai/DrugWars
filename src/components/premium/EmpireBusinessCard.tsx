import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OwnedBusiness } from '../../types/businesses';
import { BUSINESS_MAP, BUSINESS_TYPE_LABELS } from '../../data/businesses';
import { getEffectiveBusinessStats } from '../../game/businessManagementSystem';
import { GameState } from '../../types/game';
import { StatBar } from './StatBar';
import { RiskBadge } from './RiskBadge';
import { GlassCard } from './GlassCard';
import { PressableCard } from './PressableCard';
import { AppIcons } from '../../theme/icons';
import { palette, spacing, typography } from '../../theme/theme';

interface EmpireBusinessCardProps {
  state: GameState;
  record: OwnedBusiness;
  onPress?: () => void;
}

function EmpireBusinessCardInner({ state, record, onPress }: EmpireBusinessCardProps) {
  const def = BUSINESS_MAP[record.businessId];
  if (!def) return null;
  const stats = getEffectiveBusinessStats(state, record);

  const card = (
    <GlassCard tone="amber" elevated style={styles.cardInner}>
      <View style={styles.header}>
        <Text style={styles.icon}>{AppIcons.business}</Text>
        <View style={styles.headerBody}>
          <Text style={styles.name}>{def.name}</Text>
          <Text style={styles.type}>{BUSINESS_TYPE_LABELS[def.type]}</Text>
        </View>
        <RiskBadge level={def.riskLevel} />
      </View>
      <StatBar label="Condition" value={record.condition} color={palette.neon} />
      <StatBar label="Reputation" value={record.reputation ?? 55} color={palette.cyan} />
      <StatBar label="Heat" value={record.heat ?? 12} color={palette.amber} dangerAbove={60} />
      <Text style={styles.revenue}>Today est. ${stats.income}</Text>
      <Text style={styles.meta}>
        Income ${stats.income}/day · Upkeep ${stats.upkeep} · Launder ${stats.launderCap}
      </Text>
    </GlassCard>
  );

  if (!onPress) return card;
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`Business ${def.name}`}>
      {card}
    </PressableCard>
  );
}

export const EmpireBusinessCard = memo(EmpireBusinessCardInner);

const styles = StyleSheet.create({
  cardInner: { marginBottom: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' },
  icon: { fontSize: 22 },
  headerBody: { flex: 1 },
  name: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  type: { color: palette.gold, fontSize: typography.caption, fontWeight: '700', marginTop: 2 },
  revenue: { color: palette.neon, fontSize: typography.caption, fontWeight: '800', marginBottom: 4 },
  meta: { color: palette.textSecondary, fontSize: typography.caption },
});
