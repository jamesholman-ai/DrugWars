import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OwnedSafehouse } from '../../types/safehouses';
import { SAFEHOUSE_MAP, SAFEHOUSE_TIER_LABELS } from '../../data/safehouses';
import { getEffectivePropertyStats, getEffectiveStorageCapacity } from '../../game/propertyManagementSystem';
import { getStoredUsed } from '../../game/safehouseSystem';
import { GameState } from '../../types/game';
import { StatBar } from './StatBar';
import { GlassCard } from './GlassCard';
import { PressableCard } from './PressableCard';
import { AppIcons } from '../../theme/icons';
import { palette, spacing, typography } from '../../theme/theme';

interface EmpirePropertyCardProps {
  state: GameState;
  record: OwnedSafehouse;
  onPress?: () => void;
}

function EmpirePropertyCardInner({ state, record, onPress }: EmpirePropertyCardProps) {
  const def = SAFEHOUSE_MAP[record.safehouseId];
  if (!def) return null;
  const stats = getEffectivePropertyStats(state, record);
  const stored = getStoredUsed(state, record.safehouseId);
  const capacity = getEffectiveStorageCapacity(state, record.safehouseId);
  const fillPct = capacity > 0 ? Math.round((stored / capacity) * 100) : 0;

  const card = (
    <GlassCard tone="cyan" elevated style={styles.cardInner}>
      <View style={styles.header}>
        <Text style={styles.icon}>{AppIcons.property}</Text>
        <View style={styles.headerBody}>
          <Text style={styles.name}>{def.name}</Text>
          <Text style={styles.tier}>{SAFEHOUSE_TIER_LABELS[def.tier]}</Text>
        </View>
      </View>
      <StatBar label="Condition" value={record.condition} color={palette.neon} />
      <StatBar label="Security" value={Math.min(100, stats.securityLevel * 25)} color={palette.purpleBright} />
      <StatBar label="Storage fill" value={fillPct} color={palette.cyan} />
      <Text style={styles.meta}>
        {stored}/{capacity} units · Robbery −{Math.round(stats.robberyProtection * 100)}%
      </Text>
    </GlassCard>
  );

  if (!onPress) return card;
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`Property ${def.name}`}>
      {card}
    </PressableCard>
  );
}

export const EmpirePropertyCard = memo(EmpirePropertyCardInner);

const styles = StyleSheet.create({
  cardInner: { marginBottom: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' },
  icon: { fontSize: 22 },
  headerBody: { flex: 1 },
  name: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  tier: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 2 },
  meta: { color: palette.textSecondary, fontSize: typography.caption, marginTop: spacing.sm },
});
