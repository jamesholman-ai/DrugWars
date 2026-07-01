import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AAAGlassCard } from './AAAGlassCard';
import { AAAButton } from './AAAButton';
import { NextActionSuggestion } from '../../game/commandSuggestions';
import { palette, spacing, typography } from '../../theme/theme';

interface AAAMissionCardProps {
  suggestion: NextActionSuggestion;
  progressLabel?: string;
  onAction: () => void;
}

function AAAMissionCardInner({ suggestion, progressLabel, onAction }: AAAMissionCardProps) {
  return (
    <AAAGlassCard title="What's Next" tone="green">
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.message}>{suggestion.message}</Text>
      {progressLabel ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '30%' }]} />
        </View>
      ) : null}
      {progressLabel ? (
        <Text style={styles.progressText}>{progressLabel}</Text>
      ) : null}
      <View style={styles.cta}>
        <AAAButton label={suggestion.cta.toUpperCase()} variant="green" onPress={onAction} />
      </View>
    </AAAGlassCard>
  );
}

export const AAAMissionCard = memo(AAAMissionCardInner);

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  message: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.neon,
    borderRadius: 2,
  },
  progressText: {
    color: palette.neon,
    fontSize: typography.tiny,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cta: { alignItems: 'flex-start' },
});
