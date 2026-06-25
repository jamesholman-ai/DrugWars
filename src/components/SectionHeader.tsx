import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../utils/theme';

interface SectionHeaderProps {
  label: string;
  hint?: string;
}

export function SectionHeader({ label, hint }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  line: {
    width: 3,
    height: 14,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  label: {
    flex: 1,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
