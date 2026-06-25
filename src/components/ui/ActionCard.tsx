import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AccentTone, accentMap, fonts, palette, radius, spacing } from '../../theme/theme';

interface ActionCardProps {
  title: string;
  message: string;
  tone?: AccentTone;
  icon?: string;
  onPress?: () => void;
  footer?: ReactNode;
}

export function ActionCard({
  title,
  message,
  tone = 'green',
  icon,
  onPress,
  footer,
}: ActionCardProps) {
  const accent = accentMap[tone];
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: accent.bg, borderColor: accent.border }]}>
        <Text style={[styles.icon, { color: accent.text }]}>{icon ?? '◆'}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: accent.text }]}>{title}</Text>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        {footer}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.card, { borderColor: accent.border, backgroundColor: accent.bg }]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { borderColor: accent.border, backgroundColor: accent.bg }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  message: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
});
