import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface MissionCardProps {
  title: string;
  description?: string;
  progress?: string;
  progressPct?: number;
  reward?: string;
  chainLabel?: string;
  claimed?: boolean;
  canClaim?: boolean;
  claiming?: boolean;
  onClaim?: () => void;
  onPress?: () => void;
}

export function MissionCard({
  title,
  description,
  progress,
  progressPct,
  reward,
  chainLabel,
  claimed,
  canClaim,
  claiming,
  onClaim,
  onPress,
}: MissionCardProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (canClaim && !claiming) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [canClaim, claiming, pulse]);

  const content = (
    <View style={[styles.card, claimed && styles.cardClaimed]}>
      <LinearGradient
        colors={['rgba(255,184,77,0.08)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      {chainLabel ? (
        <View style={styles.chainBadge}>
          <Text style={styles.chainText}>{chainLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {progressPct != null ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, progressPct)}%` }]} />
        </View>
      ) : null}
      {progress ? <Text style={styles.progress}>{progress}</Text> : null}
      {reward ? (
        <View style={styles.rewardRow}>
          <View style={styles.rewardChip}>
            <Text style={styles.rewardLabel}>Reward</Text>
            <Text style={styles.rewardValue}>{reward}</Text>
          </View>
        </View>
      ) : null}
      {claimed ? (
        <Text style={styles.claimedTag}>Claimed</Text>
      ) : canClaim ? (
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={[styles.claimBtn, claiming && styles.claimBtnDisabled]}
            onPress={onClaim}
            disabled={claiming}
          >
            <Text style={styles.claimBtnText}>{claiming ? 'Claiming…' : 'Claim'}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCardHover,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardClaimed: {
    opacity: 0.75,
    borderColor: palette.neonDim,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  chainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.purpleGlow,
    borderWidth: 1,
    borderColor: palette.purple,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  chainText: {
    color: palette.purpleBright,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  desc: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 6,
    lineHeight: 18,
  },
  track: {
    height: 6,
    backgroundColor: palette.bg,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: palette.neon,
    borderRadius: radius.pill,
  },
  progress: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 6,
  },
  rewardRow: {
    marginTop: spacing.sm,
  },
  rewardChip: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  rewardLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  rewardValue: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  claimBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neon,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    opacity: 0.5,
  },
  claimBtnText: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
  },
  claimedTag: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
});
