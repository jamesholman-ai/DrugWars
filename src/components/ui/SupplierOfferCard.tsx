import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SupplierDefinition, SupplierOffer } from '../../types/suppliers';
import { SUPPLIER_TYPE_LABELS } from '../../data/suppliers';
import { COMMODITY_MAP } from '../../data/commodities';
import { fonts, palette, radius, spacing } from '../../theme/theme';

interface SupplierOfferCardProps {
  supplier: SupplierDefinition;
  offer?: SupplierOffer;
  trust: number;
  discountPct: number;
  marketPrice?: number;
  onBuy?: () => void;
  disabled?: boolean;
}

export function SupplierOfferCard({
  supplier,
  offer,
  trust,
  discountPct,
  marketPrice,
  onBuy,
  disabled,
}: SupplierOfferCardProps) {
  const drug = offer?.commodityId ?? supplier.specialtyDrugs[0];
  const drugName = COMMODITY_MAP[drug]?.name ?? drug;
  const qty = offer?.quantity ?? 6;
  const unitPrice = offer?.unitPrice ?? (marketPrice ? Math.round(marketPrice * (1 - discountPct)) : 0);
  const total = unitPrice * qty;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{supplier.name}</Text>
          <Text style={styles.type}>{SUPPLIER_TYPE_LABELS[supplier.type]}</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{Math.round(discountPct * 100)}%</Text>
        </View>
      </View>

      <Text style={styles.desc} numberOfLines={2}>{supplier.description}</Text>

      {offer ? (
        <View style={styles.offerBox}>
          <Text style={styles.offerLabel}>SPECIAL OFFER</Text>
          <Text style={styles.offerDetail}>
            {qty}× {drugName} @ ${unitPrice}/ea (${total.toLocaleString()})
          </Text>
          <Text style={styles.offerMsg} numberOfLines={2}>{offer.message}</Text>
        </View>
      ) : (
        <Text style={styles.regularDeal}>
          {drugName} from ${unitPrice}/ea · Reliability {supplier.reliability}%
        </Text>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Trust {trust}</Text>
        <Text style={styles.meta}>Quality {supplier.qualityLevel}/5</Text>
        <Text style={styles.meta}>Risk {supplier.riskLevel}</Text>
      </View>

      {onBuy ? (
        <Pressable
          style={[styles.buyBtn, disabled && styles.buyBtnDisabled]}
          disabled={disabled}
          onPress={onBuy}
        >
          <Text style={styles.buyBtnText}>BUY FROM {supplier.name.toUpperCase()}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  name: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  type: {
    color: palette.purpleBright,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  discountText: {
    color: palette.neon,
    fontSize: 11,
    fontWeight: '800',
  },
  desc: {
    color: palette.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: spacing.sm,
  },
  offerBox: {
    marginTop: spacing.sm,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.neonDim,
    padding: spacing.sm,
    gap: 4,
  },
  offerLabel: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  offerDetail: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  offerMsg: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  regularDeal: {
    color: palette.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 10,
  },
  buyBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buyBtnDisabled: { opacity: 0.45 },
  buyBtnText: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
