import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GameButton } from '../GameButton';
import { GlassCard } from './GlassCard';
import { StatBar } from './StatBar';
import { getDistrictImage } from '../../assets/imageRegistry';
import { SmartImageBackground } from '../aaa/SmartImageBackground';
import { FIT_PRESETS } from '../aaa/imageFit';
import { SafehouseDefinition } from '../../types/safehouses';
import { GameState } from '../../types/game';
import { PROPERTY_CATEGORY_LABELS } from '../../data/propertyTemplates';
import { getPropertyTypeLabel } from '../../data/safehouses';
import { getAreaLabel } from '../../data/locations';
import { formatMoney } from '../../utils/format';
import { palette, spacing, typography } from '../../theme/theme';
import { RANKS } from '../../data/progression';
import { RankId } from '../../types/progression';

interface PropertyListingCardProps {
  state: GameState;
  def: SafehouseDefinition;
  owned: boolean;
  locked: boolean;
  lockReason?: string;
  onRent?: () => void;
  onBuy?: () => void;
  onManage?: () => void;
}

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function PropertyListingCardInner({
  def,
  owned,
  locked,
  lockReason,
  onRent,
  onBuy,
  onManage,
}: PropertyListingCardProps) {
  const tierBadge = PROPERTY_CATEGORY_LABELS[def.category].slice(0, 1);
  const districtArt = getDistrictImage(def.cityId, def.areaId);
  const preset = FIT_PRESETS.propertyCard;
  const priceLabel =
    def.listingMode === 'rent'
      ? `${formatMoney(def.rentPerDay || 45)}/day`
      : formatMoney(def.purchaseCost);

  return (
    <GlassCard tone="purple" elevated style={styles.card}>
      <SmartImageBackground
        source={districtArt.source}
        resizeMode="cover"
        focalPoint="center"
        sourceAspectRatio={districtArt.aspectRatio}
        sourceNativeWidth={districtArt.nativeWidth}
        overlay={preset.overlay}
        overlayStrength={preset.overlayStrength}
        aspectRatio={16 / 10}
        style={styles.artBand}
      >
        <View style={styles.artText}>
          <Text style={styles.nameOnArt}>{def.name}</Text>
          <Text style={styles.districtOnArt}>{getAreaLabel(def.cityId, def.areaId)}</Text>
        </View>
      </SmartImageBackground>
      <View style={styles.body}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <Text style={styles.category}>{PROPERTY_CATEGORY_LABELS[def.category]}</Text>
          <Text style={styles.tier}>{tierBadge}</Text>
        </View>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
      <Text style={styles.name}>{def.name}</Text>
      <Text style={styles.type}>{getPropertyTypeLabel(def)}</Text>
      <Text style={styles.district}>{getAreaLabel(def.cityId, def.areaId)}</Text>
      <Text style={styles.desc} numberOfLines={2}>{def.description}</Text>

      <View style={styles.stats}>
        <StatBar label="Storage" value={Math.min(100, def.storageCapacity)} color={palette.cyan} />
        <StatBar label="Security" value={def.securityLevel} color={palette.purpleBright} />
        <StatBar label="Comfort" value={def.comfortLevel} color={palette.neon} />
        <StatBar label="Secrecy" value={def.secrecyLevel} color={palette.amber} />
      </View>

      <Text style={styles.meta}>
        Heat −{def.heatReductionPerDay}/day · Robbery −{Math.round(def.robberyProtection * 100)}%
      </Text>

      {locked && lockReason ? (
        <Text style={styles.locked}>{lockReason}</Text>
      ) : null}

      {owned ? (
        <GameButton label="MANAGE" size="sm" variant="secondary" onPress={onManage} style={styles.btn} />
      ) : def.listingMode === 'rent' ? (
        <GameButton
          label={`RENT ${formatMoney(def.rentPerDay || 45)}/day`}
          size="sm"
          disabled={locked}
          onPress={onRent}
          style={styles.btn}
        />
      ) : (
        <GameButton
          label={`BUY ${formatMoney(def.purchaseCost)}`}
          size="sm"
          disabled={locked}
          onPress={onBuy}
          style={styles.btn}
        />
      )}
      </View>
    </GlassCard>
  );
}

export const PropertyListingCard = memo(PropertyListingCardInner);

export function getPropertyLockReason(state: GameState, def: SafehouseDefinition): string | null {
  const { player, progression } = state;
  if (def.minRank && rankIndex(progression.rankId) < rankIndex(def.minRank)) {
    const rank = RANKS.find((r) => r.id === def.minRank);
    return `Requires rank: ${rank?.name ?? def.minRank}`;
  }
  if (def.minReputation != null && player.reputation < def.minReputation) {
    return `Requires ${def.minReputation} reputation`;
  }
  if (def.listingMode === 'sale' && player.cash < def.purchaseCost) {
    return `Need ${formatMoney(def.purchaseCost)} cash`;
  }
  if (def.listingMode === 'rent') {
    const deposit = Math.max(def.rentPerDay || 45, Math.round((def.rentPerDay || 45) * 0.5));
    if (player.cash < deposit) {
      return `Need ${formatMoney(deposit)} for deposit`;
    }
  }
  return null;
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, padding: 0, overflow: 'hidden' },
  artBand: { width: '100%', justifyContent: 'flex-end' },
  artText: { padding: spacing.md, zIndex: 1 },
  nameOnArt: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
  },
  districtOnArt: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  body: { padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.xs },
  category: {
    color: palette.neon,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tier: {
    color: palette.purpleBright,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: palette.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  price: { color: palette.text, fontSize: typography.caption, fontWeight: '800' },
  name: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  type: { color: palette.textMuted, fontSize: typography.caption, marginTop: 2 },
  district: { color: palette.cyan, fontSize: typography.caption, marginTop: 2 },
  desc: { color: palette.textSecondary, fontSize: typography.caption, marginTop: spacing.xs, lineHeight: 18 },
  stats: { marginTop: spacing.sm, gap: 4 },
  meta: { color: palette.textMuted, fontSize: typography.caption, marginTop: spacing.sm },
  locked: { color: palette.danger, fontSize: typography.caption, marginTop: spacing.xs, fontWeight: '600' },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
