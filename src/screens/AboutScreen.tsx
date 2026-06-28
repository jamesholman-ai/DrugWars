import React from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  APP_BUILD,
  ABOUT_PRIVACY_BULLETS,
  CREDITS_LINE,
  PRIVACY_POLICY_URL,
  STUDIO_DISPLAY_NAME,
  SUPPORT_EMAIL,
} from '../constants/appInfo';
import { GAME_DISCLAIMER } from '../data/commodities';
import { RootStackParamList } from '../types/game';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const { gameState } = useGame();
  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const openEmail = (email: string) => {
    void Linking.openURL(`mailto:${email}`);
  };

  return (
    <AppShell bottomNav={gameState ? <GameNavFooter navigation={navigation} active="More" /> : undefined}>
      <SectionCard title={APP_NAME} subtitle={`Version ${APP_VERSION}`}>
        <Text style={styles.studio}>{STUDIO_DISPLAY_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        <Text style={styles.body}>
          A fictional trading strategy game. Build an empire across cities — flip product, manage
          heat, pay the loan shark, and expand your operation.
        </Text>
      </SectionCard>

      <SectionCard title="Privacy" tone="green">
        {ABOUT_PRIVACY_BULLETS.map((note) => (
          <Text key={note} style={styles.bullet}>
            • {note}
          </Text>
        ))}
        <Pressable onPress={() => openUrl(PRIVACY_POLICY_URL)}>
          <Text style={styles.link}>Privacy Policy: {PRIVACY_POLICY_URL}</Text>
        </Pressable>
        <Pressable onPress={() => openEmail(SUPPORT_EMAIL)}>
          <Text style={styles.link}>Support: {SUPPORT_EMAIL}</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Credits">
        <Text style={styles.body}>{CREDITS_LINE}</Text>
      </SectionCard>

      <SectionCard title="Disclaimer" tone="amber">
        <Text style={styles.disclaimer}>{GAME_DISCLAIMER}</Text>
      </SectionCard>

      <GameButton
        label="IN-APP STORE"
        variant="secondary"
        onPress={() => navigation.navigate('Store')}
      />

      <Text style={styles.versionDetails}>
        Version {APP_VERSION} (build {APP_BUILD})
      </Text>

      <GameButton label="BACK" variant="secondary" onPress={() => navigation.goBack()} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  studio: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tagline: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 20,
  },
  bullet: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  link: {
    color: palette.neon,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  disclaimer: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  versionDetails: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
});
