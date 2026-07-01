import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AAAGlassCard } from './AAAGlassCard';
import { AAAButton } from './AAAButton';
import { AppIcon } from '../../theme/icons';
import { palette, spacing, typography } from '../../theme/theme';

export interface IntelLine {
  id: string;
  label: string;
  message: string;
  tone?: 'good' | 'urgent' | 'neutral';
}

interface AAAIntelPanelProps {
  lines: IntelLine[];
  onViewAll: () => void;
}

function AAAIntelPanelInner({ lines, onViewAll }: AAAIntelPanelProps) {
  return (
    <AAAGlassCard title="Today's Intel" tone="cyan">
      {lines.length === 0 ? (
        <Text style={styles.empty}>No intel on the wire yet.</Text>
      ) : (
        lines.slice(0, 3).map((line) => (
          <View key={line.id} style={styles.row}>
            <Text
              style={[
                styles.badge,
                line.tone === 'urgent' && styles.badgeUrgent,
                line.tone === 'good' && styles.badgeGood,
              ]}
            >
              {line.label}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {line.message}
            </Text>
          </View>
        ))
      )}
      <Pressable onPress={onViewAll} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>VIEW ALL INTEL</Text>
        <AppIcon name="intel" size={14} color={palette.cyan} />
      </Pressable>
    </AAAGlassCard>
  );
}

export const AAAIntelPanel = memo(AAAIntelPanelInner);

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  badge: {
    color: palette.cyan,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  badgeUrgent: { color: palette.danger },
  badgeGood: { color: palette.neon },
  message: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  empty: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: spacing.xs,
  },
  linkText: {
    color: palette.cyan,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
