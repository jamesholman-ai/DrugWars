import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../utils/theme';

interface ActionMessageProps {
  message: string;
}

export function ActionMessage({ message }: ActionMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <View style={styles.body}>
        <Text style={styles.tag}>LAST ACTION</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  indicator: {
    width: 4,
    backgroundColor: colors.accent,
  },
  body: {
    flex: 1,
    padding: spacing.sm,
  },
  tag: {
    color: colors.accentDim,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: 3,
    fontWeight: '700',
  },
  message: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 17,
  },
});
