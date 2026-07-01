import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../../utils/format';
import { AppIcon, AppIcons, IconName } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface EmpireSummaryFooterProps {
  crewCount: number;
  businessCount: number;
  propertyCount: number;
  dailyNet: number;
  onPress?: () => void;
}

function SummaryItem({ icon, count }: { icon: IconName; count: number }) {
  return (
    <View style={styles.itemRow}>
      <AppIcon name={icon} size={14} color={palette.textSecondary} />
      <Text style={styles.item}>{count}</Text>
    </View>
  );
}

function EmpireSummaryFooterInner({
  crewCount,
  businessCount,
  propertyCount,
  dailyNet,
  onPress,
}: EmpireSummaryFooterProps) {
  const content = (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <SummaryItem icon={AppIcons.crew} count={crewCount} />
        <Text style={styles.dot}>·</Text>
        <SummaryItem icon={AppIcons.business} count={businessCount} />
        <Text style={styles.dot}>·</Text>
        <SummaryItem icon={AppIcons.property} count={propertyCount} />
      </View>
      <Text style={[styles.net, dailyNet >= 0 ? styles.positive : styles.negative]}>
        Daily net {dailyNet >= 0 ? '+' : ''}{formatMoney(dailyNet)}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Empire summary">
      {content}
    </Pressable>
  );
}

export const EmpireSummaryFooter = memo(EmpireSummaryFooterInner);

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.charcoal,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  item: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  dot: {
    color: palette.textMuted,
  },
  net: {
    textAlign: 'center',
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 4,
  },
  positive: {
    color: palette.neon,
  },
  negative: {
    color: palette.danger,
  },
});
