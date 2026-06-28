import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getReputationFlavor } from '../../data/reputationFlavor';
import { getReputationTier } from '../../game/progression';
import { accentMap, palette, radius, spacing, typography } from '../../theme/theme';

interface ReputationBadgeProps {
  reputation: number;
  compact?: boolean;
}

export function ReputationBadge({ reputation, compact }: ReputationBadgeProps) {
  const tier = getReputationTier(reputation);
  const flavor = getReputationFlavor(reputation);
  const tone =
    reputation >= 80 ? accentMap.purple : reputation >= 45 ? accentMap.amber : accentMap.neutral;

  return (
    <View style={[styles.wrap, { borderColor: tone.border, backgroundColor: tone.bg }]}>
      <View style={styles.row}>
        <Text style={[styles.street, { color: tone.text }]}>{flavor.streetName}</Text>
        <Text style={styles.rep}>{reputation}/100</Text>
      </View>
      {!compact ? (
        <>
          <Text style={styles.tier}>{tier.name.toUpperCase()}</Text>
          <Text style={styles.line}>{flavor.headline}</Text>
        </>
      ) : (
        <Text style={styles.lineCompact} numberOfLines={1}>
          {tier.name} · {flavor.supplierNote}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  street: {
    fontSize: typography.subtitle,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rep: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tier: {
    color: palette.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.6,
  },
  line: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  lineCompact: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});
