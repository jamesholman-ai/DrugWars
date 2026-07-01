import React, { memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

export interface WorldEventImpact {
  label: string;
  tone: 'red' | 'purple' | 'green';
}

interface WorldEventImageCardProps {
  eventType?: string;
  title: string;
  tag?: string;
  description?: string;
  impacts?: WorldEventImpact[];
  compact?: boolean;
  embedded?: boolean;
  onPress?: () => void;
}

const IMPACT_COLOR = {
  red: palette.danger,
  purple: palette.purpleBright,
  green: palette.neon,
};

function eventGradient(eventType?: string): readonly [string, string, string] {
  const t = (eventType ?? '').toLowerCase();
  if (t.includes('police') || t.includes('raid') || t.includes('crackdown')) {
    return ['#1a0a12', '#2d1020', '#0d0810'];
  }
  if (t.includes('boom') || t.includes('demand')) {
    return ['#0a1a10', '#102818', '#060d08'];
  }
  return ['#120a1e', '#1a1030', '#0a0612'];
}

function WorldEventImageCardInner({
  eventType,
  title,
  tag = 'WORLD EVENT',
  description,
  impacts,
  compact,
  embedded,
  onPress,
}: WorldEventImageCardProps) {
  const gradient = eventGradient(eventType);

  const card = (
    <View style={[styles.wrap, compact && styles.wrapCompact, embedded && styles.embedded]}>
      <View
        style={[
          styles.photo,
          compact ? { height: 88 } : { aspectRatio: 16 / 9 },
        ]}
      >
        <LinearGradient colors={[...gradient]} style={StyleSheet.absoluteFill} />
        <View style={styles.iconBadge}>
          <AppIcon name="news" size={compact ? 18 : 22} color={palette.purpleBright} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.tag}>{tag}</Text>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
            {title.toUpperCase()}
          </Text>
          {!compact && description ? (
            <Text style={styles.desc} numberOfLines={2}>{description}</Text>
          ) : null}
        </View>
      </View>
      {!compact && impacts && impacts.length > 0 ? (
        <View style={styles.impactRow}>
          {impacts.map((impact) => (
            <View key={impact.label} style={styles.impactChip}>
              <Text style={[styles.impactText, { color: IMPACT_COLOR[impact.tone] }]}>
                {impact.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return card;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {card}
    </Pressable>
  );
}

export const WorldEventImageCard = memo(WorldEventImageCardInner);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.purple,
    overflow: 'hidden',
    backgroundColor: palette.bgCard,
    marginBottom: spacing.sm,
  },
  wrapCompact: {
    borderColor: palette.border,
  },
  embedded: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
  },
  photo: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: palette.bgCard,
  },
  iconBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    padding: spacing.md,
    justifyContent: 'flex-end',
    flex: 1,
  },
  tag: {
    color: palette.purpleBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: typography.caption,
  },
  desc: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
    lineHeight: 18,
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.sm,
    paddingTop: 0,
  },
  impactChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: palette.bgElevated,
  },
  impactText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
