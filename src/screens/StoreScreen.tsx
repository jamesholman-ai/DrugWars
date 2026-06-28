import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, SectionCard } from '../components/ui';
import { StoreProductCard } from '../components/premium';
import { formatPurchaseHistoryLine, useStore } from '../context/StoreContext';
import { useGame } from '../game/GameContext';
import { getStoreInventory } from '../game/storeInventory';
import { getProfileInventorySummary } from '../game/consumableCredits';
import {
  getProductsByCategory,
  STORE_CATEGORIES,
} from '../data/products';
import { RootStackParamList } from '../types/game';
import { ProductId } from '../types/products';
import { palette, radius, shadows, spacing, typography } from '../theme/theme';
import { isDevMockStoreEnabled, isPlatformBillingLive } from '../services/platformBilling';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function StoreScreen({ navigation }: Props) {
  const { gameState, useConsumable, revealIntel } = useGame();
  const {
    profile,
    isStoreReady,
    storePurchaseEnabled,
    platformBillingLive,
    devMockEnabled,
    billingStatusMessage,
    purchaseStoreProduct,
    getOwnedForCategory,
    getOwnedForProduct,
    restorePurchases,
    resetPlayerProfile,
  } = useStore();
  const [busyId, setBusyId] = useState<ProductId | 'restore' | null>(null);

  const storeInv = gameState ? getStoreInventory(gameState) : null;
  const wallet = getProfileInventorySummary(profile);

  const handlePurchase = async (productId: ProductId) => {
    if (!storePurchaseEnabled) {
      showMessage('Unavailable', billingStatusMessage);
      return;
    }

    setBusyId(productId);
    try {
      const result = await purchaseStoreProduct(productId);
      showMessage(result.ok ? 'Purchase Complete' : 'Purchase Failed', result.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleUse = async (productId: ProductId) => {
    if (productId.startsWith('intel_pack')) {
      revealIntel();
      showMessage('Intel', 'Reveal token spent — check your message log or Intel screen.');
      return;
    }

    setBusyId(productId);
    try {
      const result = await useConsumable(productId);
      showMessage(result.ok ? 'Applied' : 'Could Not Use', result.message);
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

  const handleResetProfile = () => {
    if (!isDevMockStoreEnabled()) return;
    void (async () => {
      const ok =
        Platform.OS === 'web'
          ? window.confirm('Reset all test wallet credits and purchase history?')
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                'Reset Player Profile',
                'Clears all test consumables and purchase history. Your saved run is kept.',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                  { text: 'Reset Profile', style: 'destructive', onPress: () => resolve(true) },
                ]
              );
            });
      if (!ok) return;
      await resetPlayerProfile();
      showMessage('Profile Reset', 'Test wallet and purchase history cleared.');
    })();
  };

  if (!isStoreReady) {
    return (
      <AppShell scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.neon} size="large" />
          <Text style={styles.loadingText}>Loading store…</Text>
        </View>
      </AppShell>
    );
  }

  const history = profile.purchaseHistory.slice(0, 10);
  const showRestore = platformBillingLive || devMockEnabled;
  const heroSubtitle = storePurchaseEnabled
    ? 'Purchases add wallet credits that persist across runs. Use credits when you need them.'
    : 'Optional boost packs are listed for reference. In-app purchases are not available in this release.';

  return (
    <AppShell bottomNav={gameState ? <GameNavFooter navigation={navigation} active="More" /> : undefined}>
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(155,92,255,0.15)', 'rgba(16,19,26,0.98)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.heroTag}>Optional Boosts</Text>
        <Text style={styles.heroTitle}>Empire Store</Text>
        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
      </View>

      <SectionCard title="Your Wallet" tone="green" subtitle="Persists across new games">
        <Text style={styles.inventoryLine}>
          Lawyer {wallet.lawyer} · Intel {wallet.intel} · Raid {wallet.robbery}
        </Text>
        <Text style={styles.inventoryLine}>
          Starter {wallet.starter} · Heat {wallet.heat} · Storage {wallet.storage}
        </Text>
        <Text style={styles.inventoryLine}>
          Crew {wallet.crew} · Business {wallet.business}
        </Text>
        {storeInv ? (
          <Text style={styles.runLine}>
            This run: {storeInv.payrollCredits} payroll day(s) · {storeInv.businessUpkeepCredits}{' '}
            upkeep day(s) banked
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Billing Status" tone="amber">
        <Text style={styles.statusText}>{billingStatusMessage}</Text>
        {devMockEnabled ? (
          <Text style={styles.statusHint}>Dev testing mode — mock purchases only, no real charges.</Text>
        ) : null}
        {platformBillingLive ? (
          <Text style={styles.statusHint}>Live IAP enabled.</Text>
        ) : null}
        {!storePurchaseEnabled ? (
          <Text style={styles.statusHint}>In-app purchases are not available in this release.</Text>
        ) : null}
      </SectionCard>

      {!gameState && storePurchaseEnabled ? (
        <SectionCard title="Active Run" tone="purple">
          <Text style={styles.statusText}>
            You can buy wallet credits anytime. Start a game to use heat, crew, business, and starter
            boosts on a run.
          </Text>
        </SectionCard>
      ) : !gameState ? (
        <SectionCard title="Active Run" tone="purple">
          <Text style={styles.statusText}>
            Start a game to use any wallet credits you already own on a run.
          </Text>
        </SectionCard>
      ) : null}

      {STORE_CATEGORIES.map((category) => {
        const products = getProductsByCategory(category.id);
        const ownedCategory = getOwnedForCategory(category.id);

        return (
          <SectionCard
            key={category.id}
            title={category.title}
            subtitle={
              ownedCategory > 0
                ? `${category.subtitle} · ${ownedCategory} owned`
                : category.subtitle
            }
            elevated
          >
            {products.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                ownedCount={getOwnedForProduct(product.id)}
                usedThisRun={
                  product.effects.oncePerRun
                    ? (storeInv?.starterBoostUsedThisRun.includes(product.id) ?? false)
                    : false
                }
                billingEnabled={storePurchaseEnabled}
                canUse={!!gameState}
                busy={busyId === product.id}
                onPurchase={() => void handlePurchase(product.id)}
                onUse={() => void handleUse(product.id)}
              />
            ))}
          </SectionCard>
        );
      })}

      {history.length > 0 ? (
        <SectionCard title="Purchase History" subtitle="Stored on this device">
          {history.map((record) => (
            <Text key={record.transactionId} style={styles.historyLine}>
              {formatPurchaseHistoryLine(record)}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      <Text style={styles.footerNote}>
        {storePurchaseEnabled
          ? 'Purchases are optional. No random rewards.'
          : 'The full game is playable without purchases.'}
      </Text>

      {showRestore ? (
        <GameButton
          label={busyId === 'restore' ? 'Restoring…' : 'Restore Purchases'}
          variant="secondary"
          disabled={busyId !== null}
          onPress={() => void handleRestore()}
        />
      ) : null}

      {isDevMockStoreEnabled() ? (
        <GameButton
          label="Reset Player Profile (Dev)"
          variant="danger"
          disabled={busyId !== null}
          onPress={handleResetProfile}
        />
      ) : null}

      <GameButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
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
    fontSize: typography.body,
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.purple,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.glowPurple,
  },
  heroTag: {
    color: palette.purpleBright,
    fontSize: typography.caption,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: palette.text,
    fontSize: typography.hero,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  statusText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  statusHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  inventoryLine: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: 4,
  },
  runLine: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  historyLine: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginBottom: 4,
  },
  footerNote: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
});
