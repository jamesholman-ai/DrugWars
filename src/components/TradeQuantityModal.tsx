import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GameButton } from './GameButton';
import { fonts, palette, radius, spacing } from '../theme/theme';

interface TradeQuantityModalProps {
  visible: boolean;
  mode: 'buy' | 'sell' | 'deposit' | 'withdraw';
  commodityName?: string;
  maxQty: number;
  unitPrice?: number;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}

export function TradeQuantityModal({
  visible,
  mode,
  commodityName,
  maxQty,
  unitPrice,
  onConfirm,
  onClose,
}: TradeQuantityModalProps) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) {
      setQty(Math.min(1, maxQty));
    }
  }, [visible, maxQty]);

  if (!visible || maxQty <= 0) return null;

  const title =
    mode === 'buy'
      ? 'Buy Quantity'
      : mode === 'sell'
        ? 'Sell Quantity'
        : mode === 'deposit'
          ? 'Deposit Quantity'
          : 'Withdraw Quantity';

  const clampQty = (next: number) => Math.max(1, Math.min(maxQty, next));

  const totalCost = unitPrice != null ? unitPrice * qty : null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {commodityName ? <Text style={styles.subtitle}>{commodityName}</Text> : null}

          <View style={styles.qtyRow}>
            <Pressable
              style={[styles.stepBtn, qty <= 1 && styles.stepBtnDisabled]}
              disabled={qty <= 1}
              onPress={() => setQty((q) => clampQty(q - 1))}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{qty}</Text>
            <Pressable
              style={[styles.stepBtn, qty >= maxQty && styles.stepBtnDisabled]}
              disabled={qty >= maxQty}
              onPress={() => setQty((q) => clampQty(q + 1))}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.maxHint}>Max {maxQty} units</Text>

          <View style={styles.quickRow}>
            {[1, 5, 10, maxQty].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).map((preset) => (
              <Pressable
                key={preset}
                style={[styles.quickBtn, qty === preset && styles.quickBtnActive]}
                onPress={() => setQty(clampQty(preset))}
              >
                <Text style={[styles.quickText, qty === preset && styles.quickTextActive]}>
                  {preset === maxQty ? 'MAX' : preset}
                </Text>
              </Pressable>
            ))}
          </View>

          {totalCost != null ? (
            <Text style={styles.costLine}>Total: ${totalCost.toLocaleString()}</Text>
          ) : null}

          <View style={styles.actions}>
            <GameButton label="CANCEL" size="sm" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <GameButton
              label={mode === 'buy' ? 'BUY' : mode === 'sell' ? 'SELL' : mode === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
              size="sm"
              onPress={() => {
                onConfirm(qty);
                onClose();
              }}
              style={styles.actionBtn}
            />
          </View>
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
    borderColor: palette.neonDim,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepText: {
    color: palette.neon,
    fontSize: 22,
    fontWeight: '800',
  },
  qtyValue: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '800',
    minWidth: 48,
    textAlign: 'center',
  },
  maxHint: {
    color: palette.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickBtn: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  quickBtnActive: {
    borderColor: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  quickText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  quickTextActive: {
    color: palette.neon,
  },
  costLine: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
