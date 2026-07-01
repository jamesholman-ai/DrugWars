import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableCard } from './PressableCard';
import { AppIcon, AppIcons, IconName, isIconName } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName | string;
  onPress: () => void;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

function QuickActionsGridInner({ actions }: QuickActionsGridProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>QUICK ACTIONS</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <PressableCard
            key={action.id}
            onPress={action.onPress}
            style={styles.cellWrap}
            accessibilityLabel={action.label}
          >
            <View style={styles.cell}>
              {isIconName(action.icon) ? (
                <AppIcon name={action.icon} size={22} color={palette.neon} />
              ) : (
                <Text style={styles.icon}>{action.icon}</Text>
              )}
              <Text style={styles.label}>{action.label}</Text>
            </View>
          </PressableCard>
        ))}
      </View>
    </View>
  );
}

export const DEFAULT_QUICK_ACTION_ICONS = AppIcons;

export const QuickActionsGrid = memo(QuickActionsGridInner);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  heading: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cellWrap: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
  },
  cell: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textAlign: 'center',
  },
});
