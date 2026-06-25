import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { AppShell, SectionCard } from '../components/ui';
import { formatPurchaseHistoryLine, useStore } from '../context/StoreContext';
import { useGame } from '../game/GameContext';
import { getStoreInventory } from '../game/storeInventory';
import { getCategoryInventorySummary } from '../game/storePurchaseSystem';
import {
  getProductsByCategory,
  STORE_CATEGORIES,
} from '../data/products';
import { RootStackParamList } from '../types/game';
import { ProductDefinition, ProductId } from '../types/products';
import { fonts, palette, radius, shadows, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function tierStyle(packSize: ProductDefinition['packSize']) {
  if (packSize === 'large') return styles.offerLarge;
  if (packSize === 'medium') return styles.offerMedium;
  return styles.offerSmall;
}

function ProductOfferCard({
  product,
  usedThisRun,
  billingEnabled,
  busy,
  onPurchase,
}: {
  product: ProductDefinition;
  usedThisRun: boolean;
  billingEnabled: boolean;
  busy: boolean;
  onPurchase: (id: ProductId) => void;
}) {
  const disabled = busy || usedThisRun;

  return (
    <View style={[styles.offerCard, tierStyle(product.packSize)]}>
      <View style={styles.offerHeader}>
        <View style={styles.offerTitleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.offerTitle}>{product.title}</Text>
            {product.bestValue ? (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.offerSubtitle}>{product.subtitle}</Text>
        </View>
        <Text style={styles.offerPrice}>{product.priceLabel}</Text>
      </View>

      {product.benefits.map((benefit) => (
        <Text key={benefit} style={styles.benefit}>
          • {benefit}
        </Text>
      ))}

      {usedThisRun ? (
        <View style={styles.usedBadge}>
          <Text style={styles.usedBadgeText}>USED THIS RUN</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.purchaseBtn, disabled && styles.purchaseBtnDisabled]}
        disabled={disabled}
        onPress={() => onPurchase(product.id)}
      >
        <Text style={styles.purchaseBtnText}>
          {usedThisRun
            ? 'UNAVAILABLE'
            : busy
              ? 'PROCESSING…'
              : billingEnabled
                ? `BUY — ${product.priceLabel}`
                : 'COMING SOON'}
        </Text>
      </Pressable>
    </View>
  );
}

export function StoreScreen({ navigation }: Props) {
  const { gameState, purchaseStoreProduct } = useGame();
  const {
    entitlements,
    isStoreReady,
    storePurchaseEnabled,
    platformBillingLive,
    billingStatusMessage,
    restorePurchases,
  } = useStore();
  const [busyId, setBusyId] = useState<ProductId | 'restore' | null>(null);

  const storeInv = gameState ? getStoreInventory(gameState) : null;

  const handlePurchase = async (productId: ProductId) => {
    if (!storePurchaseEnabled) {
      showMessage('Coming Soon', billingStatusMessage);
      return;
    }

    if (!gameState) {
      showMessage('No Active Run', 'Start or continue a game before buying consumables.');
      return;
    }

    setBusyId(productId);
    try {
      const result = await purchaseStoreProduct(productId);
      showMessage(result.ok ? 'Purchase Applied' : 'Purchase Failed', result.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async () => {
    setBusyId('restore');
    try {
      const result = await restorePurchases();
      showMessage(result.ok ? 'Restore Purchases' : 'Restore Failed', result.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!isStoreReady) {
    return (
      <AppShell scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.neon} />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      </AppShell>
    );
  }

  const history = entitlements.purchaseHistory.slice(0, 10);

  return (
    <AppShell>
      <View style={styles.hero}>
        <Text style={styles.heroTag}>AVAILABLE DAY 1</Text>
        <Text style={styles.heroTitle}>Consumable Store</Text>
        <Text style={styles.heroSubtitle}>
          Optional fixed packs — no loot boxes, no random paid rewards. The base game stays fully
          playable without purchases.
        </Text>
      </View>

      {!gameState ? (
        <SectionCard title="Active Run Required" tone="amber">
          <Text style={styles.statusText}>
            Start or continue a game to apply consumable purchases to your current run.
          </Text>
        </SectionCard>
      ) : null}

      {storeInv ? (
        <SectionCard title="Your Inventory" tone="green" subtitle="Current run balances">
          <Text style={styles.inventoryLine}>
            Lawyer tokens: {storeInv.lawyerTokens} · Intel tips: {storeInv.intelTips} · Raid
            tokens: {storeInv.robberyProtectionTokens}
          </Text>
          <Text style={styles.inventoryLine}>
            Payroll credits: {storeInv.payrollCredits} day(s) · Upkeep credits:{' '}
            {storeInv.businessUpkeepCredits} day(s)
          </Text>
        </SectionCard>
      ) : null}

      <SectionCard title="Status" tone="amber">
        <Text style={styles.statusText}>{billingStatusMessage}</Text>
        {!platformBillingLive ? (
          <Text style={styles.statusHint}>
            Local testing mode applies purchases immediately without real charges.
          </Text>
        ) : null}
      </SectionCard>

      {STORE_CATEGORIES.map((category) => {
        const products = getProductsByCategory(category.id);
        const summary = gameState ? getCategoryInventorySummary(gameState, category.id) : null;

        return (
          <SectionCard
            key={category.id}
            title={category.title}
            subtitle={summary ? `${category.subtitle} · ${summary}` : category.subtitle}
          >
            {products.map((product) => (
              <ProductOfferCard
                key={product.id}
                product={product}
                usedThisRun={
                  product.effects.oncePerRun
                    ? (storeInv?.starterBoostUsedThisRun.includes(product.id) ?? false)
                    : false
                }
                billingEnabled={storePurchaseEnabled}
                busy={busyId === product.id}
                onPurchase={handlePurchase}
              />
            ))}
          </SectionCard>
        );
      })}

      {history.length > 0 ? (
        <SectionCard title="Purchase History" subtitle="Stored locally on this device">
          {history.map((record, index) => (
            <Text
              key={`${record.productId}-${record.purchasedAt}-${index}`}
              style={styles.historyLine}
            >
              {formatPurchaseHistoryLine(record)}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard title="Fair Play">
        <Text style={styles.disclaimerLine}>
          Optional purchases. No random rewards, loot boxes, or gambling.
        </Text>
        <Text style={styles.disclaimerLine}>
          Boosts help but do not remove all risk. Payments use Apple/Google billing when live.
        </Text>
      </SectionCard>

      <GameButton
        label={busyId === 'restore' ? 'RESTORING…' : 'RESTORE PURCHASES'}
        variant="secondary"
        disabled={busyId !== null}
        onPress={() => void handleRestore()}
      />

      <GameButton label="BACK" variant="ghost" onPress={() => navigation.goBack()} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  hero: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.neonDim,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.glowGreen,
  },
  heroTag: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  statusText: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  statusHint: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  inventoryLine: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 4,
  },
  offerCard: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  offerSmall: {
    borderColor: palette.borderBright,
  },
  offerMedium: {
    borderColor: palette.purpleBright,
    backgroundColor: palette.purpleGlow,
  },
  offerLarge: {
    borderColor: palette.amber,
    backgroundColor: palette.amberGlow,
    borderWidth: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  offerTitleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offerTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bestValueBadge: {
    backgroundColor: palette.amberGlow,
    borderWidth: 1,
    borderColor: palette.amberDim,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bestValueText: {
    color: palette.amber,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offerSubtitle: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: 2,
  },
  offerPrice: {
    color: palette.neon,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  benefit: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 2,
  },
  usedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  usedBadgeText: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  purchaseBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  purchaseBtnDisabled: {
    opacity: 0.5,
    borderColor: palette.border,
    backgroundColor: palette.bgElevated,
  },
  purchaseBtnText: {
    color: palette.neon,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  historyLine: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    marginBottom: 4,
  },
  disclaimerLine: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
});
