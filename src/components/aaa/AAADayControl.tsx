import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AAAButton } from './AAAButton';
import { AAAGlassCard } from './AAAGlassCard';
import { formatMoney } from '../../utils/format';
import { spacing } from '../../theme/theme';

interface AAADayControlProps {
  canRest: boolean;
  healCost: number;
  onRest: () => void;
  onStay: () => void;
  disabled?: boolean;
}

function AAADayControlInner({
  canRest,
  healCost,
  onRest,
  onStay,
  disabled,
}: AAADayControlProps) {
  return (
    <AAAGlassCard title="Day Control" subtitle="Advance time or recover">
      <View style={styles.row}>
        <View style={styles.half}>
          <AAAButton
            label={canRest ? `Rest ${formatMoney(healCost)}` : 'Rest — N/A'}
            variant="ghost"
            size="md"
            disabled={!canRest || disabled}
            onPress={onRest}
            fullWidth
          />
        </View>
        <View style={styles.half}>
          <AAAButton
            label="Stay → +1 Day"
            variant="gold"
            size="md"
            disabled={disabled}
            onPress={onStay}
            fullWidth
          />
        </View>
      </View>
    </AAAGlassCard>
  );
}

export const AAADayControl = memo(AAADayControlInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: { flex: 1 },
});
