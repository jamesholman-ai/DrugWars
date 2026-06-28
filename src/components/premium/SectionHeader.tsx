import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing, typography } from '../../theme/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
  },
});
