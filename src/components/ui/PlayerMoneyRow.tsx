import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoneyPanel } from '../premium/MoneyPanel';
import { AppIcons } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface PlayerMoneyRowProps {
  availableCash: string;
  dirtyCash: string;
  cleanCash: string;
  availableValue?: number;
  dirtyValue?: number;
  cleanValue?: number;
  compact?: boolean;
}

const HELP = {
  available:
    'Total spendable money (dirty + clean). Most street purchases use dirty cash first.',
  dirty: 'Street earnings. High heat risk. Launder through businesses to convert to clean cash.',
  clean: 'Legal-looking money. Required for crew, properties, and businesses.',
};

export function PlayerMoneyRow({
  availableCash,
  dirtyCash,
  cleanCash,
  availableValue,
  dirtyValue,
  cleanValue,
  compact = false,
}: PlayerMoneyRowProps) {
  const [helpKey, setHelpKey] = useState<'available' | 'dirty' | 'clean' | null>(null);

  const toggle = (key: 'available' | 'dirty' | 'clean') => {
    setHelpKey((prev) => (prev === key ? null : key));
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => toggle('available')} accessibilityLabel="Cash on hand">
        <MoneyPanel
          label="Cash on Hand"
          amount={availableCash}
          amountValue={availableValue}
          tone="green"
          icon={AppIcons.money}
          hero
        />
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable style={styles.secondaryTap} onPress={() => toggle('dirty')} accessibilityLabel="Dirty cash">
          <MoneyPanel
            label="Dirty"
            amount={dirtyCash}
            amountValue={dirtyValue}
            tone="amber"
            icon={AppIcons.dirty}
          />
        </Pressable>
        <Pressable style={styles.secondaryTap} onPress={() => toggle('clean')} accessibilityLabel="Clean cash">
          <MoneyPanel
            label="Clean"
            amount={cleanCash}
            amountValue={cleanValue}
            tone="purple"
            icon={AppIcons.clean}
          />
        </Pressable>
      </View>

      {helpKey ? (
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>{HELP[helpKey]}</Text>
          {!compact ? (
            <Text style={styles.helpHint}>Tap again to dismiss.</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.helpHint}>Tap a balance for details.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryTap: {
    flex: 1,
    minWidth: 0,
  },
  helpBox: {
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  helpText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  helpHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
