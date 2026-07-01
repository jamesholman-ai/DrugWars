import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../theme/icons';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface AAAStatusPanelProps {
  health: number;
  heat: number;
  reputation: number;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.barWrap}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function heatLevelLabel(heat: number): { label: string; color: string } {
  if (heat >= 80) return { label: 'CRITICAL', color: palette.danger };
  if (heat >= 50) return { label: 'HIGH', color: palette.amber };
  if (heat >= 25) return { label: 'MODERATE', color: palette.gold };
  return { label: 'LOW', color: palette.neon };
}

function AAAStatusPanelInner({ health, heat, reputation }: AAAStatusPanelProps) {
  const heatLevel = heatLevelLabel(heat);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        <Bar label="HEALTH" value={health} color={palette.neon} />
        <Bar label="HEAT" value={heat} color={palette.amber} />
        <Bar label="REPUTATION" value={reputation} color={palette.purpleBright} />
      </View>
      <View style={styles.heatCard}>
        <Text style={styles.heatTitle}>HEAT LEVEL</Text>
        <View style={styles.avatarFallback}>
          <AppIcon name="heat" size={28} color={palette.amber} />
        </View>
        <Text style={[styles.heatLabel, { color: heatLevel.color }]}>{heatLevel.label}</Text>
        <View style={styles.shields}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.shield, heat >= (i + 1) * 25 && styles.shieldOn]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export const AAAStatusPanel = memo(AAAStatusPanelInner);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bars: {
    flex: 1,
    gap: spacing.sm,
  },
  barWrap: {},
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  barValue: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  heatCard: {
    width: 96,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  heatTitle: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heatLabel: {
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  shields: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  shield: {
    width: 14,
    height: 16,
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  shieldOn: {
    backgroundColor: palette.amber,
    borderColor: palette.amber,
  },
});
