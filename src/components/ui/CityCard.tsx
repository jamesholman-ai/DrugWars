import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCityMaster } from '../../assets/imageRegistry';
import { SmartImageBackground } from '../aaa/SmartImageBackground';
import { FIT_PRESETS } from '../aaa/imageFit';
import { palette, radius, spacing, typography } from '../../theme/theme';
import { WorldEventBadge } from './WorldEventBadge';

interface CityCardProps {
  cityId?: string;
  name: string;
  travelCost: number;
  riskLevel: 'low' | 'medium' | 'high';
  specialtyDrugs: string[];
  demandDrugs: string[];
  isCurrent?: boolean;
  isLocked?: boolean;
  onPress?: () => void;
  onTravel?: () => void;
  expanded?: boolean;
}

const RISK_HEADER: Record<CityCardProps['riskLevel'], readonly [string, string]> = {
  low: ['rgba(53,255,136,0.15)', 'rgba(16,19,26,0.98)'],
  medium: ['rgba(255,184,77,0.15)', 'rgba(16,19,26,0.98)'],
  high: ['rgba(255,59,79,0.15)', 'rgba(16,19,26,0.98)'],
};

export function CityCard({
  cityId,
  name,
  travelCost,
  riskLevel,
  specialtyDrugs,
  demandDrugs,
  isCurrent,
  isLocked,
  onPress,
  onTravel,
  expanded,
}: CityCardProps) {
  const travelArt = cityId ? getCityMaster(cityId) : null;
  const preset = FIT_PRESETS.travelCard;

  return (
    <Pressable
      style={[styles.card, isCurrent && styles.current, isLocked && styles.locked]}
      onPress={onPress}
      disabled={isLocked}
    >
      <View style={styles.headerWrap}>
        {travelArt ? (
          <SmartImageBackground
            source={travelArt.source}
            resizeMode="cover"
            focalPoint={preset.focalPoint}
            sourceAspectRatio={travelArt.aspectRatio}
            sourceNativeWidth={travelArt.nativeWidth}
            overlay={false}
            fill
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <LinearGradient colors={[...RISK_HEADER[riskLevel]]} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.cityName}>{name}</Text>
            {isCurrent ? <Text style={styles.currentTag}>Here</Text> : null}
          </View>
          <WorldEventBadge severity={riskLevel} />
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Travel cost</Text>
          <Text style={styles.costValue}>${travelCost.toLocaleString()}</Text>
        </View>
      </LinearGradient>
      </View>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Travel cost</Text>
              <Text style={styles.statValueGreen}>${travelCost.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Risk level</Text>
              <Text style={[styles.statValueRisk, riskLevel === 'low' && styles.riskLow, riskLevel === 'medium' && styles.riskMed, riskLevel === 'high' && styles.riskHigh]}>
                {riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.intelChip}>
            <Text style={styles.intelLabel}>Specialty (cheap here)</Text>
            <Text style={styles.intelValue} numberOfLines={2}>
              {specialtyDrugs.length ? specialtyDrugs.join(' · ') : '—'}
            </Text>
          </View>
          <View style={[styles.intelChip, styles.demandChip]}>
            <Text style={[styles.intelLabel, styles.demandLabel]}>High demand</Text>
            <Text style={styles.intelValue} numberOfLines={2}>
              {demandDrugs.length ? demandDrugs.join(' · ') : '—'}
            </Text>
          </View>
          {onTravel && !isCurrent && !isLocked ? (
            <Pressable style={styles.travelBtn} onPress={onTravel}>
              <Text style={styles.travelBtnText}>TRAVEL TO {name.toUpperCase()}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.compactRow}>
          <Text style={styles.compactMeta} numberOfLines={1}>
            Cheap: {specialtyDrugs.slice(0, 2).join(', ') || '—'}
          </Text>
          <Text style={styles.compactMeta} numberOfLines={1}>
            Hot: {demandDrugs.slice(0, 2).join(', ') || '—'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: palette.bgCard,
  },
  current: {
    borderColor: palette.neonDim,
  },
  locked: {
    opacity: 0.5,
  },
  headerWrap: {
    aspectRatio: 16 / 10,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.bgCard,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  cityName: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    flexShrink: 1,
  },
  currentTag: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '800',
    backgroundColor: palette.neonSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  costLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  costValue: {
    color: palette.neon,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: palette.bgCardHover,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginBottom: 4,
  },
  statValueGreen: {
    color: palette.neon,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  statValueRisk: {
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  riskLow: { color: palette.neon },
  riskMed: { color: palette.amber },
  riskHigh: { color: palette.danger },
  intelChip: {
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  demandChip: {
    borderColor: palette.dangerDim,
  },
  intelLabel: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: 4,
  },
  demandLabel: {
    color: palette.danger,
  },
  intelValue: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  travelBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  travelBtnText: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
  },
  compactRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  compactMeta: {
    color: palette.textSecondary,
    fontSize: typography.caption,
  },
});
