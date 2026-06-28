import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CityAreaDefinition, TerritoryOwner } from '../../types/game';
import { formatDemandHint, formatOwnerLabel } from '../../game/territory';
import { RiskBadge } from '../premium/RiskBadge';
import { StatChip } from '../premium/StatChip';
import { palette, radius, spacing, typography } from '../../theme/theme';

function riskLevel(level: number): 'low' | 'medium' | 'high' {
  if (level >= 4) return 'high';
  if (level >= 3) return 'medium';
  return 'low';
}

const OWNER_STYLE: Record<
  TerritoryOwner,
  { bg: string; border: string; text: string }
> = {
  neutral: {
    bg: palette.bgElevated,
    border: palette.border,
    text: palette.textSecondary,
  },
  rival_gang: {
    bg: palette.dangerGlow,
    border: palette.danger,
    text: palette.danger,
  },
  cartel: {
    bg: palette.purpleGlow,
    border: palette.purple,
    text: palette.purpleBright,
  },
  police_controlled: {
    bg: palette.amberGlow,
    border: palette.amber,
    text: palette.gold,
  },
  player_controlled: {
    bg: palette.neonSoft,
    border: palette.neonDim,
    text: palette.neon,
  },
};

interface AreaCardProps {
  area: CityAreaDefinition;
  owner: TerritoryOwner;
  isCurrent?: boolean;
  disabled?: boolean;
  blockedReason?: string;
  onPress?: () => void;
}

export function AreaInfoPanel({ area, owner }: { area: CityAreaDefinition; owner: TerritoryOwner }) {
  const ownerStyle = OWNER_STYLE[owner];
  const demand = formatDemandHint(area.demandModifiers);

  return (
    <View style={styles.infoPanel}>
      <View style={styles.chipRow}>
        <RiskBadge level={area.riskLevel} />
        <StatChip label="Police" value={`${area.policePresence}%`} tone="amber" />
      </View>
      <Text style={styles.demandLabel}>Demand intel</Text>
      <Text style={styles.demandValue}>{demand}</Text>
      <View style={[styles.ownerBadge, { backgroundColor: ownerStyle.bg, borderColor: ownerStyle.border }]}>
        <Text style={[styles.ownerText, { color: ownerStyle.text }]}>
          {formatOwnerLabel(owner)}
        </Text>
      </View>
    </View>
  );
}

export function AreaCard({
  area,
  owner,
  isCurrent,
  disabled,
  blockedReason,
  onPress,
}: AreaCardProps) {
  const ownerStyle = OWNER_STYLE[owner];
  const risk = riskLevel(area.riskLevel);

  return (
    <Pressable
      style={[
        styles.card,
        risk === 'high' && styles.cardHigh,
        risk === 'medium' && styles.cardMed,
        risk === 'low' && styles.cardLow,
        isCurrent && styles.current,
        disabled && !isCurrent && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {isCurrent ? (
        <LinearGradient
          colors={['rgba(53,255,136,0.12)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, isCurrent && styles.nameCurrent]} numberOfLines={1}>
            {area.name}
          </Text>
          {isCurrent ? <Text style={styles.hereTag}>Here</Text> : null}
        </View>
        <RiskBadge level={area.riskLevel} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Police {area.policePresence}%</Text>
        <Text style={styles.cost}>${area.travelCost}</Text>
      </View>
      <View style={[styles.ownerBadge, { backgroundColor: ownerStyle.bg, borderColor: ownerStyle.border }]}>
        <Text style={[styles.ownerText, { color: ownerStyle.text }]}>
          {formatOwnerLabel(owner)}
        </Text>
      </View>
      {blockedReason ? (
        <Text style={styles.blocked} numberOfLines={2}>
          {blockedReason}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    minHeight: 88,
    overflow: 'hidden',
  },
  cardLow: {
    borderColor: palette.neonDim,
  },
  cardMed: {
    borderColor: palette.amberDim,
  },
  cardHigh: {
    borderColor: palette.dangerDim,
  },
  current: {
    borderColor: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  disabled: {
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  name: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  nameCurrent: {
    color: palette.neon,
  },
  hereTag: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '800',
    backgroundColor: palette.neonSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ownerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  ownerText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: {
    color: palette.textSecondary,
    fontSize: typography.caption,
  },
  cost: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  blocked: {
    color: palette.danger,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  infoPanel: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demandLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  demandValue: {
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
