import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radius, spacing } from '../../theme/theme';
import { WorldEventBadge } from './WorldEventBadge';

interface CityCardProps {
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

export function CityCard({
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
  return (
    <Pressable
      style={[styles.card, isCurrent && styles.current, isLocked && styles.locked]}
      onPress={onPress}
      disabled={isLocked}
    >
      <View style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.cityName}>{name}</Text>
            {isCurrent ? <Text style={styles.currentTag}>HERE</Text> : null}
          </View>
          <WorldEventBadge severity={riskLevel} />
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>TRAVEL</Text>
          <Text style={styles.costValue}>${travelCost.toLocaleString()}</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.drugSection}>
            <Text style={styles.sectionLabel}>SPECIALTY (CHEAP)</Text>
            <Text style={styles.drugList} numberOfLines={2}>
              {specialtyDrugs.length ? specialtyDrugs.join(' · ') : '—'}
            </Text>
          </View>
          <View style={styles.drugSection}>
            <Text style={[styles.sectionLabel, styles.demandLabel]}>DEMAND (EXPENSIVE)</Text>
            <Text style={styles.drugList} numberOfLines={2}>
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
    borderRadius: radius.lg,
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
  headerGradient: {
    padding: spacing.md,
    backgroundColor: '#14141f',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
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
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  currentTag: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: palette.neonSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  costLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  costValue: {
    color: palette.neon,
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  drugSection: {
    gap: 2,
  },
  sectionLabel: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  demandLabel: {
    color: palette.danger,
  },
  drugList: {
    color: palette.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  travelBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  travelBtnText: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  compactRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  compactMeta: {
    color: palette.textMuted,
    fontSize: 10,
  },
});
