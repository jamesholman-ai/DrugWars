import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GameButton } from './GameButton';
import { palette, radius, spacing, typography } from '../theme/theme';

interface FinanceAmountModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  maxAmount: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function FinanceAmountModal({
  visible,
  title,
  subtitle,
  maxAmount,
  onConfirm,
  onClose,
}: FinanceAmountModalProps) {
  const [text, setText] = useState('100');

  useEffect(() => {
    if (visible) {
      setText(String(Math.min(100, Math.max(1, maxAmount))));
    }
  }, [visible, maxAmount]);

  if (!visible || maxAmount <= 0) return null;

  const parsed = Math.floor(Number(text.replace(/[^0-9]/g, '')) || 0);
  const amount = Math.min(maxAmount, Math.max(0, parsed));
  const valid = amount > 0;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={palette.textMuted}
            selectTextOnFocus
          />
          <Text style={styles.maxHint}>Max ${maxAmount.toLocaleString()}</Text>

          <View style={styles.quickRow}>
            {[100, 500, 1000].map((preset) => (
              <Pressable
                key={preset}
                style={[styles.quickBtn, preset > maxAmount && styles.quickBtnDisabled]}
                disabled={preset > maxAmount}
                onPress={() => setText(String(Math.min(preset, maxAmount)))}
              >
                <Text style={styles.quickText}>${preset.toLocaleString()}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.quickBtn} onPress={() => setText(String(maxAmount))}>
              <Text style={styles.quickText}>Max</Text>
            </Pressable>
          </View>

          <GameButton
            label={valid ? `Pay $${amount.toLocaleString()}` : 'Enter amount'}
            disabled={!valid}
            onPress={() => onConfirm(amount)}
          />
          <GameButton label="Cancel" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  label: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    color: palette.neon,
    fontSize: typography.hero,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  maxHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginBottom: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickBtn: {
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  quickBtnDisabled: {
    opacity: 0.4,
  },
  quickText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
