import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, IconName } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

export interface ActivityItem {
  id: string;
  label: string;
  message: string;
  tone?: 'good' | 'urgent' | 'neutral' | 'info';
}

interface AAAActivityStripProps {
  items: ActivityItem[];
  onPressItem?: (id: string) => void;
}

const TONE_ICON: Record<NonNullable<ActivityItem['tone']>, IconName> = {
  good: 'success',
  urgent: 'warning',
  neutral: 'news',
  info: 'intel',
};

const TONE_COLOR: Record<NonNullable<ActivityItem['tone']>, string> = {
  good: palette.neon,
  urgent: palette.danger,
  neutral: palette.cyan,
  info: palette.purpleBright,
};

function AAAActivityStripInner({ items, onPressItem }: AAAActivityStripProps) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {items.slice(0, 3).map((item) => {
        const tone = item.tone ?? 'neutral';
        const color = TONE_COLOR[tone];
        return (
          <Pressable
            key={item.id}
            style={[styles.chip, { borderColor: color }]}
            onPress={() => onPressItem?.(item.id)}
            disabled={!onPressItem}
          >
            <AppIcon name={TONE_ICON[tone]} size={14} color={color} />
            <View style={styles.textCol}>
              <Text style={[styles.chipLabel, { color }]}>{item.label}</Text>
              <Text style={styles.chipMsg} numberOfLines={1}>{item.message}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export const AAAActivityStrip = memo(AAAActivityStripInner);

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  textCol: { flex: 1, minWidth: 0 },
  chipLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  chipMsg: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 1,
  },
});
