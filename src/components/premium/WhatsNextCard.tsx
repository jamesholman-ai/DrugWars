import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { NextActionSuggestion } from '../../game/commandSuggestions';
import { palette, spacing, typography } from '../../theme/theme';

interface WhatsNextCardProps {
  suggestion: NextActionSuggestion;
  onAction: () => void;
}

function WhatsNextCardInner({ suggestion, onAction }: WhatsNextCardProps) {
  return (
    <GlassCard title="What's Next?" tone="green" elevated>
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.message}>{suggestion.message}</Text>
      <View style={styles.cta}>
        <NeonButton label={suggestion.cta} onPress={onAction} size="md" />
      </View>
    </GlassCard>
  );
}

export const WhatsNextCard = memo(WhatsNextCardInner);

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  message: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cta: {
    alignItems: 'flex-start',
  },
});
