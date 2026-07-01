import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, IconName } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

export interface AAAQuickAction {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
}

interface AAAQuickActionsProps {
  actions: AAAQuickAction[];
}

function AAAQuickActionsInner({ actions }: AAAQuickActionsProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>QUICK ACTIONS</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <AppIcon name={action.icon} size={24} color={palette.neon} />
            <Text style={styles.label}>{action.label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const AAAQuickActions = memo(AAAQuickActionsInner);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  heading: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: 'rgba(16, 19, 26, 0.88)',
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cellPressed: {
    opacity: 0.85,
    borderColor: palette.neon,
  },
  label: {
    color: palette.text,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
