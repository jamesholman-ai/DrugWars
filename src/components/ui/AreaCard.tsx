import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CityAreaDefinition, TerritoryOwner } from '../../types/game';
import { formatDemandHint, formatOwnerLabel } from '../../game/territory';
import { fonts, palette, radius, spacing } from '../../theme/theme';

function riskLabel(level: number): 'LOW' | 'MED' | 'HIGH' {
  if (level >= 4) return 'HIGH';
  if (level >= 3) return 'MED';
  return 'LOW';
}

const OWNER_STYLE: Record<
  TerritoryOwner,
  { bg: string; border: string; text: string }
> = {
  neutral: {
    bg: palette.bgElevated,
    border: palette.border,
    text: palette.textMuted,
  },
  rival_gang: {
    bg: palette.dangerGlow,
    border: palette.danger,
    text: palette.danger,
  },
  cartel: {
    bg: palette.purpleGlow,
    border: palette.purpleBright,
    text: palette.purpleBright,
  },
  police_controlled: {
    bg: palette.amberGlow,
    border: palette.amber,
    text: palette.amber,
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
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>RISK</Text>
        <Text style={styles.infoValue}>{riskLabel(area.riskLevel)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>POLICE</Text>
        <Text style={styles.infoValue}>{area.policePresence}%</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>DEMAND</Text>
        <Text style={[styles.infoValue, styles.demandValue]} numberOfLines={2}>
          {demand}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>OWNER</Text>
        <View style={[styles.ownerBadge, { backgroundColor: ownerStyle.bg, borderColor: ownerStyle.border }]}>
          <Text style={[styles.ownerText, { color: ownerStyle.text }]}>
            {formatOwnerLabel(owner).toUpperCase()}
          </Text>
        </View>
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

  return (
    <Pressable
      style={[
        styles.card,
        isCurrent && styles.current,
        disabled && !isCurrent && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, isCurrent && styles.nameCurrent]} numberOfLines={1}>
            {area.name}
          </Text>
          {isCurrent ? <Text style={styles.hereTag}>HERE</Text> : null}
        </View>
        <View style={[styles.ownerBadge, { backgroundColor: ownerStyle.bg, borderColor: ownerStyle.border }]}>
          <Text style={[styles.ownerText, { color: ownerStyle.text }]}>
            {formatOwnerLabel(owner).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Risk {riskLabel(area.riskLevel)}</Text>
        <Text style={styles.meta}>Police {area.policePresence}%</Text>
        <Text style={styles.cost}>${area.travelCost}</Text>
      </View>
      {blockedReason ? (
        <Text style={styles.blocked} numberOfLines={1}>
          {blockedReason}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 72,
  },
  current: {
    borderColor: palette.neonDim,
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
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  nameCurrent: {
    color: palette.neon,
  },
  hereTag: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
    backgroundColor: palette.neonSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  ownerBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownerText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 10,
  },
  cost: {
    color: palette.textSecondary,
    fontSize: 10,
    marginLeft: 'auto',
    fontWeight: '700',
  },
  blocked: {
    color: palette.danger,
    fontSize: 9,
    marginTop: 4,
  },
  infoPanel: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  infoLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    width: 56,
  },
  infoValue: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  demandValue: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.textSecondary,
  },
});
