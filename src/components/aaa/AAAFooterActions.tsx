import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, IconName } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface FooterAction {
  id: string;
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
}

interface AAAFooterActionsProps {
  actions: FooterAction[];
}

function AAAFooterActionsInner({ actions }: AAAFooterActionsProps) {
  return (
    <View style={styles.wrap}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={[styles.item, action.disabled && styles.disabled]}
          onPress={action.onPress}
          disabled={action.disabled}
        >
          <AppIcon name={action.icon} size={18} color={palette.neon} />
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const AAAFooterActions = memo(AAAFooterActionsInner);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  disabled: { opacity: 0.4 },
  label: {
    color: palette.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
