import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoneyCard } from './MoneyCard';
import { fonts, palette, radius, spacing } from '../../theme/theme';

interface PlayerMoneyRowProps {
  availableCash: string;
  dirtyCash: string;
  cleanCash: string;
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
  compact = false,
}: PlayerMoneyRowProps) {
  const [helpKey, setHelpKey] = useState<'available' | 'dirty' | 'clean' | null>(null);

  const toggle = (key: 'available' | 'dirty' | 'clean') => {
    setHelpKey((prev) => (prev === key ? null : key));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable style={styles.cardTap} onPress={() => toggle('available')}>
          <MoneyCard label="Available Cash" amount={availableCash} tone="green" icon="💵" />
        </Pressable>
        <Pressable style={styles.cardTap} onPress={() => toggle('dirty')}>
          <MoneyCard label="Dirty Cash" amount={dirtyCash} tone="amber" icon="💸" />
        </Pressable>
        <Pressable style={styles.cardTap} onPress={() => toggle('clean')}>
          <MoneyCard label="Clean Cash" amount={cleanCash} tone="purple" icon="✓" />
        </Pressable>
      </View>
      {helpKey ? (
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>{HELP[helpKey]}</Text>
          {!compact ? (
            <Text style={styles.helpHint}>Tap a money card again to dismiss.</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.helpHint}>Tap any money card for details.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardTap: {
    flex: 1,
    minWidth: 0,
  },
  helpBox: {
    marginTop: spacing.sm,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  helpText: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
  },
  helpHint: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
