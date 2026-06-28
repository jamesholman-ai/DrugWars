import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductDefinition } from '../../types/products';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface StoreProductCardProps {
  product: ProductDefinition;
  ownedCount: number;
  usedThisRun: boolean;
  billingEnabled: boolean;
  canUse: boolean;
  busy: boolean;
  onPurchase: () => void;
  onUse?: () => void;
}

function tierLabel(packSize: ProductDefinition['packSize']) {
  if (packSize === 'large') return 'Large';
  if (packSize === 'medium') return 'Medium';
  return 'Small';
}

function tierTone(packSize: ProductDefinition['packSize']) {
  if (packSize === 'large') return { border: palette.purple, bg: palette.purpleGlow };
  if (packSize === 'medium') return { border: palette.cyan, bg: 'rgba(57,200,255,0.12)' };
  return { border: palette.borderBright, bg: palette.bgGloss };
}

const CATEGORY_ICON: Record<ProductDefinition['category'], string> = {
  starter: '⚡',
  legal: '⚖',
  intel: '📡',
  heat: '🔥',
  storage: '📦',
  crew: '👥',
  business: '🏢',
};

export function StoreProductCard({
  product,
  ownedCount,
  usedThisRun,
  billingEnabled,
  canUse,
  busy,
  onPurchase,
  onUse,
}: StoreProductCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const tier = tierTone(product.packSize);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const showUse = ownedCount > 0 && onUse;
  const purchaseDisabled = busy || (product.effects.oncePerRun && usedThisRun && ownedCount === 0);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }, product.bestValue && shadows.glowGold]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'transparent']}
        style={styles.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{CATEGORY_ICON[product.category]}</Text>
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            {product.bestValue ? (
              <View style={styles.bestBadge}>
                <Text style={styles.bestText}>Best Value</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>{product.subtitle}</Text>
        </View>
        <View style={[styles.tierBadge, { borderColor: tier.border, backgroundColor: tier.bg }]}>
          <Text style={styles.tierText}>{tierLabel(product.packSize)}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{product.priceLabel}</Text>
        {ownedCount > 0 ? (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>Owned: {ownedCount}</Text>
          </View>
        ) : null}
      </View>

      {product.benefits.map((benefit) => (
        <Text key={benefit} style={styles.benefit}>
          • {benefit}
        </Text>
      ))}

      {usedThisRun && product.effects.oncePerRun ? (
        <View style={styles.usedBadge}>
          <Text style={styles.usedText}>Applied this run</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {showUse ? (
          <Pressable
            style={[styles.useBtn, (!canUse || busy) && styles.btnDisabled]}
            disabled={!canUse || busy}
            onPress={onUse}
            onPressIn={pressIn}
            onPressOut={pressOut}
          >
            <Text style={styles.useText}>{busy ? 'Working…' : 'Use'}</Text>
          </Pressable>
        ) : null}

        {billingEnabled ? (
          <Pressable
            style={[styles.purchaseBtn, purchaseDisabled && styles.btnDisabled, showUse && styles.purchaseBtnCompact]}
            disabled={purchaseDisabled}
            onPress={onPurchase}
            onPressIn={pressIn}
            onPressOut={pressOut}
          >
            <Text style={styles.purchaseText}>
              {busy ? 'Processing…' : `Buy — ${product.priceLabel}`}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.unavailableBtn}>
            <Text style={styles.unavailableText}>Not available in this release</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 2,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tierText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  bestBadge: {
    backgroundColor: palette.amberGlow,
    borderWidth: 1,
    borderColor: palette.amberDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bestText: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  price: {
    color: palette.neon,
    fontSize: typography.title,
    fontWeight: '800',
  },
  ownedBadge: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ownedText: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  benefit: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: 4,
  },
  usedBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  usedText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  useBtn: {
    backgroundColor: 'rgba(57,200,255,0.12)',
    borderWidth: 1,
    borderColor: palette.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  useText: {
    color: palette.cyan,
    fontSize: typography.body,
    fontWeight: '800',
  },
  purchaseBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  purchaseBtnCompact: {
    opacity: 0.95,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  purchaseText: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
  },
  unavailableBtn: {
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  unavailableText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});
