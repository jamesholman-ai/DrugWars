import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { AppShell, SectionCard } from '../components/ui';
import { NeonButton } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getAreaLabel } from '../data/locations';
import { GAME_DISCLAIMER } from '../data/commodities';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { APP_VERSION, COPYRIGHT_LINE, DEVELOPER_LINE } from '../constants/appInfo';
import { confirmAction } from '../utils/confirm';
import { isDevMockStoreEnabled } from '../services/platformBilling';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const {
    gameState,
    hasSavedGame,
    isStorageReady,
    startNewGame,
    continueGame,
    resetSave,
    resetAllData,
  } = useGame();
  const [busy, setBusy] = useState(false);

  const handleNewGame = () => {
    const run = async () => {
      setBusy(true);
      try {
        await startNewGame();
        navigation.navigate('Game');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not start a new game.';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('New Game Failed', message);
        }
      } finally {
        setBusy(false);
      }
    };

    if (hasSavedGame) {
      void (async () => {
        const ok = await confirmAction(
          'Start New Game?',
        'This overwrites your saved run. Wallet credits and purchases are kept.',
        'New Game'
        );
        if (ok) {
          await run();
        }
      })();
      return;
    }

    void run();
  };

  const handleContinue = async () => {
    setBusy(true);
    try {
      const ok = await continueGame();
      if (ok) {
        navigation.navigate('Game');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResetSave = () => {
    void (async () => {
      const ok = await confirmAction(
        'Reset Current Run?',
        'This deletes your saved run only. Wallet credits and purchase history are kept.',
        'Reset Run'
      );
      if (!ok) return;
      setBusy(true);
      try {
        await resetSave();
      } finally {
        setBusy(false);
      }
    })();
  };

  const handleResetAllData = () => {
    void (async () => {
      const ok = await confirmAction(
        'Reset All Local Data?',
        'This deletes your saved run AND all wallet credits / test purchases. Cannot be undone.',
        'Reset Everything'
      );
      if (!ok) return;
      setBusy(true);
      try {
        await resetAllData();
      } finally {
        setBusy(false);
      }
    })();
  };

  const savePreview = gameState && hasSavedGame;
  const locationName = savePreview
    ? getAreaLabel(gameState.player.currentCityId, gameState.player.currentAreaId)
    : null;

  if (!isStorageReady) {
    return (
      <AppShell scroll={false} background="hero">
        <View style={styles.loading}>
          <ActivityIndicator color={palette.neon} size="large" />
          <Text style={styles.loadingText}>Reading local save…</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell contentStyle={styles.content} background="hero">
      <View style={styles.menuHeader}>
        <Text style={styles.menuEyebrow}>Main Menu</Text>
        <Text style={styles.menuTitle}>Drug Wars Reloaded</Text>
        <Text style={styles.menuSubtitle}>Choose your next move.</Text>
      </View>

      {savePreview ? (
        <SectionCard title="Saved Run" tone="green" elevated>
          <Text style={styles.saveLine}>Day {gameState.player.day}</Text>
          <Text style={styles.saveLine}>{locationName}</Text>
          <Text style={styles.saveLine}>
            Cash {formatMoney(gameState.player.cash)} · Debt {formatMoney(gameState.player.debt)}
          </Text>
          {gameState.player.isGameOver ? (
            <Text style={styles.saveOver}>Run ended — start fresh or continue viewing.</Text>
          ) : null}
        </SectionCard>
      ) : null}

      <View style={styles.actions}>
        {hasSavedGame ? (
          <NeonButton
            label="Continue Game"
            size="lg"
            icon="↻"
            disabled={busy}
            onPress={() => void handleContinue()}
          />
        ) : null}
        <NeonButton
          label="New Game"
          size="lg"
          icon="▶"
          variant={hasSavedGame ? 'secondary' : 'primary'}
          disabled={busy}
          onPress={handleNewGame}
        />
        <NeonButton
          label="Store"
          size="md"
          variant="purple"
          icon="✦"
          onPress={() => navigation.navigate('Store')}
        />
        <GameButton
          label="About & Privacy"
          size="md"
          variant="ghost"
          onPress={() => navigation.navigate('About')}
        />
        {hasSavedGame ? (
          <>
            <NeonButton
              label="Reset Run"
              size="md"
              variant="danger"
              disabled={busy}
              onPress={handleResetSave}
            />
            {isDevMockStoreEnabled() ? (
              <GameButton
                label="Reset All Data (Dev)"
                size="md"
                variant="ghost"
                disabled={busy}
                onPress={handleResetAllData}
              />
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.footerMeta}>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Offline · No account</Text>
        </View>
        <Text style={styles.version}>v{APP_VERSION}</Text>
        <Text style={styles.developer}>{DEVELOPER_LINE}</Text>
        <Text style={styles.copyright}>{COPYRIGHT_LINE}</Text>
      </View>

      <Text style={styles.disclaimer}>{GAME_DISCLAIMER}</Text>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
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
  menuHeader: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  menuEyebrow: {
    color: palette.cyan,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  menuTitle: {
    color: palette.text,
    fontSize: typography.hero,
    fontWeight: '900',
  },
  menuSubtitle: {
    color: palette.textSecondary,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  saveLine: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  saveOver: {
    color: palette.gold,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  actions: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  footerMeta: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  offlineBadge: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.xs,
  },
  offlineText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  version: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  developer: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  copyright: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimer: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
