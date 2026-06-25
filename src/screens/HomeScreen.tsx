import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { AppShell, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { getAreaLabel } from '../data/locations';
import { GAME_DISCLAIMER } from '../data/commodities';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { APP_VERSION } from '../constants/appInfo';
import { confirmAction } from '../utils/confirm';
import { fonts, palette, radius, shadows, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const {
    gameState,
    hasSavedGame,
    isStorageReady,
    startNewGame,
    continueGame,
    resetSave,
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
          'This will overwrite your saved run.',
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
        'Reset Save?',
        'This permanently deletes your saved run from this device. This cannot be undone.',
        'Reset Save'
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

  const savePreview = gameState && hasSavedGame;
  const locationName = savePreview
    ? getAreaLabel(gameState.player.currentCityId, gameState.player.currentAreaId)
    : null;

  if (!isStorageReady) {
    return (
      <AppShell scroll={false}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.neon} />
          <Text style={styles.loadingText}>Reading local save...</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroGlowTop} />
        <Text style={styles.heroTag}>UNDERWORLD TRADING</Text>
        <Text style={styles.title}>DRUG WARS{'\n'}RELOADED</Text>
        <Text style={styles.tagline}>Buy low. Move fast. Rule the market.</Text>
        <Text style={styles.lore}>
          Hustle across 15 cities and 7 districts. Flip product, dodge heat, pay the loan shark,
          and chase the biggest score.
        </Text>
      </View>

      {savePreview ? (
        <SectionCard title="Saved Run" tone="green">
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
          <GameButton
            label="CONTINUE GAME"
            size="lg"
            icon="↻"
            disabled={busy}
            onPress={() => void handleContinue()}
          />
        ) : null}
        <GameButton
          label="NEW GAME"
          size="lg"
          icon="▶"
          variant={hasSavedGame ? 'secondary' : 'primary'}
          disabled={busy}
          onPress={handleNewGame}
        />
        {hasSavedGame ? (
          <GameButton
            label="RESET SAVE"
            size="md"
            variant="danger"
            disabled={busy}
            onPress={handleResetSave}
          />
        ) : null}
      </View>

      <SectionCard title="Operator Tips" tone="amber">
        <TipRow n="01" text="Buy when price is low (▼). Sell when price is high (▲)." />
        <TipRow n="02" text="Area travel = same day. City travel = next day + interest." />
        <TipRow n="03" text="Mission rewards on the Hub — claim after First Move." />
      </SectionCard>

      <GameButton
        label="ABOUT & PRIVACY"
        size="sm"
        variant="ghost"
        onPress={() => navigation.navigate('About')}
      />

      <Text style={styles.version}>v{APP_VERSION} · Offline · No account</Text>

      <Text style={styles.disclaimer}>{GAME_DISCLAIMER}</Text>
    </AppShell>
  );
}

function TipRow({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipNum}>{n}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
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
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.glowGreen,
  },
  heroGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.neon,
    opacity: 0.7,
  },
  heroTag: {
    color: palette.amber,
    fontFamily: fonts.display,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  title: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: 2,
  },
  tagline: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  lore: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  saveLine: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  saveOver: {
    color: palette.amber,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  actions: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tipNum: {
    color: palette.cyan,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    width: 22,
  },
  tipText: {
    flex: 1,
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
  },
  disclaimer: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    lineHeight: 14,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  version: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
