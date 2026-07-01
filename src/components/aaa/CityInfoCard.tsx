import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCityMaster } from '../../assets/imageRegistry';
import { BackgroundImageCard } from './BackgroundImageCard';
import { palette, radius, spacing, typography } from '../../theme/theme';
import { AppIcon } from '../../theme/icons';

interface CityInfoCardProps {
  cityId: string;
  name: string;
  regionLabel?: string;
  travelCost: number;
  riskLevel: 'low' | 'medium' | 'high';
  specialtyDrugs: string[];
  demandDrugs: string[];
  empireLine?: string;
  empireHint?: string;
  isCurrent?: boolean;
  isLocked?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  onTravel?: () => void;
}

const RISK_COLOR = {
  low: palette.neon,
  medium: palette.amber,
  high: palette.danger,
};

function CityInfoCardInner({
  cityId,
  name,
  regionLabel,
  travelCost,
  riskLevel,
  specialtyDrugs,
  demandDrugs,
  empireLine,
  empireHint,
  isCurrent,
  isLocked,
  expanded,
  onPress,
  onTravel,
}: CityInfoCardProps) {
  const heroArt = getCityMaster(cityId);

  return (
    <Pressable
      style={[styles.card, isCurrent && styles.current, isLocked && styles.locked]}
      onPress={onPress}
      disabled={isLocked}
    >
      <BackgroundImageCard
        art={heroArt}
        fitMode="card"
        focalPoint="center"
        overlayStrength={0.35}
        borderColor={isCurrent ? palette.neonDim : palette.border}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>CITY INFO</Text>
        <Text style={styles.heroCity}>{name.toUpperCase()}</Text>
        {regionLabel ? <Text style={styles.heroRegion}>{regionLabel.toUpperCase()}</Text> : null}
        {isCurrent ? <Text style={styles.here}>CURRENT LOCATION</Text> : null}
      </BackgroundImageCard>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Travel cost</Text>
              <Text style={styles.statGreen}>${travelCost.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Risk level</Text>
              <Text style={[styles.statRisk, { color: RISK_COLOR[riskLevel] }]}>
                {riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.intelRow}>
            <View style={styles.intelChip}>
              <View style={styles.intelHead}>
                <AppIcon name="market" size={12} color={palette.neon} />
                <Text style={styles.intelTitle}>Specialty</Text>
              </View>
              <Text style={styles.intelValue} numberOfLines={2}>
                {specialtyDrugs.length ? specialtyDrugs.join(' · ') : '—'}
              </Text>
            </View>
            <View style={[styles.intelChip, styles.demandChip]}>
              <View style={styles.intelHead}>
                <AppIcon name="trendUp" size={12} color={palette.danger} />
                <Text style={[styles.intelTitle, styles.demandTitle]}>High demand</Text>
              </View>
              <Text style={styles.intelValue} numberOfLines={2}>
                {demandDrugs.length ? demandDrugs.join(' · ') : '—'}
              </Text>
            </View>
          </View>

          {empireLine ? (
            <View style={styles.empireRow}>
              <AppIcon name="empire" size={12} color={palette.purpleBright} />
              <Text style={styles.empireText}>{empireLine}</Text>
            </View>
          ) : null}
          {empireHint ? (
            <Text style={styles.empireHint}>{empireHint}</Text>
          ) : null}

          {onTravel && !isCurrent && !isLocked ? (
            <Pressable style={styles.travelBtn} onPress={onTravel}>
              <AppIcon name="travel" size={16} color={palette.neon} />
              <Text style={styles.travelBtnText}>TRAVEL TO {name.toUpperCase()}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.compact}>
          <Text style={styles.compactMeta} numberOfLines={1}>
            ${travelCost.toLocaleString()} · {riskLevel.toUpperCase()} risk
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export const CityInfoCard = memo(CityInfoCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: palette.bgCard,
  },
  current: { borderColor: palette.neonDim },
  locked: { opacity: 0.5 },
  hero: { marginBottom: 0, borderWidth: 0, borderRadius: 0 },
  heroLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroCity: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroRegion: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  here: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.8,
  },
  body: { padding: spacing.md, gap: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
  },
  statLabel: { color: palette.textMuted, fontSize: typography.caption, marginBottom: 4 },
  statGreen: { color: palette.neon, fontSize: typography.subtitle, fontWeight: '800' },
  statRisk: { fontSize: typography.subtitle, fontWeight: '800' },
  intelRow: { gap: spacing.sm },
  intelChip: {
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  demandChip: { borderColor: palette.dangerDim },
  intelHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  intelTitle: { color: palette.neon, fontSize: typography.caption, fontWeight: '700' },
  demandTitle: { color: palette.danger },
  intelValue: { color: palette.textSecondary, fontSize: typography.caption, lineHeight: 18 },
  empireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  empireText: {
    color: palette.purpleBright,
    fontSize: typography.caption,
    fontWeight: '700',
    flex: 1,
  },
  empireHint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: 4,
    lineHeight: 16,
  },
  travelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  travelBtnText: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compact: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  compactMeta: { color: palette.textSecondary, fontSize: typography.caption },
});
