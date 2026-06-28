import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { CityNewsEntry } from '../../types/cityNews';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface IntelLine {
  id: string;
  label: string;
  message: string;
  tone?: 'urgent' | 'good' | 'neutral';
}

interface CommandIntelCardProps {
  lines: IntelLine[];
  onViewAll?: () => void;
}

function toneColor(tone?: IntelLine['tone']) {
  if (tone === 'urgent') return palette.danger;
  if (tone === 'good') return palette.neon;
  return palette.cyan;
}

function CommandIntelCardInner({ lines, onViewAll }: CommandIntelCardProps) {
  return (
    <GlassCard title="Today's Intel" tone="cyan" subtitle={`${lines.length} signal${lines.length === 1 ? '' : 's'}`}>
      {lines.length === 0 ? (
        <Text style={styles.empty}>Quiet on the wire. Check back after you move.</Text>
      ) : (
        lines.map((line) => (
          <View key={line.id} style={styles.row}>
            <Text style={[styles.label, { color: toneColor(line.tone) }]}>{line.label}</Text>
            <Text style={styles.message} numberOfLines={2}>{line.message}</Text>
          </View>
        ))
      )}
      {onViewAll ? (
        <Pressable onPress={onViewAll} accessibilityRole="link">
          <Text style={styles.link}>Full intel & news →</Text>
        </Pressable>
      ) : null}
    </GlassCard>
  );
}

export const CommandIntelCard = memo(CommandIntelCardInner);

/** Build up to 3 intel lines from city news entries (presentation only). */
export function cityNewsToIntelLines(entries: CityNewsEntry[], limit = 3): IntelLine[] {
  return entries.slice(0, limit).map((e) => ({
    id: e.id,
    label: e.category.toUpperCase(),
    message: e.headline,
    tone: e.tone === 'urgent' ? 'urgent' : e.sentiment === 'bullish' ? 'good' : 'neutral',
  }));
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  message: {
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  empty: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  link: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
