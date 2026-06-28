import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActiveWorldEvent, WorldEventType } from '../../types/game';
import { daysRemaining, eventAppliesToLocation } from '../../game/worldEvents';
import { WorldEventBadge } from './WorldEventBadge';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

const TYPE_LABEL: Record<WorldEventType, string> = {
  market_shortage: 'Shortage',
  market_crash: 'Crash',
  market_boom: 'Boom',
  police_crackdown: 'Crackdown',
  gang_war: 'Gang War',
  airport_lockdown: 'Lockdown',
  supplier_flood: 'Flood',
  informant_network_buzz: 'Intel',
};

interface WorldEventTickerProps {
  events: ActiveWorldEvent[];
  currentDay: number;
  currentAreaKey: string;
}

export function WorldEventTicker({ events, currentDay, currentAreaKey }: WorldEventTickerProps) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📡</Text>
        <Text style={styles.emptyTitle}>World Intel</Text>
        <Text style={styles.emptyText}>Markets are quiet — no active shortages or crackdowns.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>📡</Text>
        <Text style={styles.header}>World Intel</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {events.map((event) => {
          const remaining = daysRemaining(event, currentDay);
          const local = eventAppliesToLocation(event, currentAreaKey);
          const typeLabel = TYPE_LABEL[event.type] ?? event.type;

          return (
            <View key={event.id} style={[styles.chip, local && styles.chipLocal]}>
              <View style={styles.chipHeader}>
                <Text style={styles.typeLabel}>{typeLabel}</Text>
                <WorldEventBadge severity={event.severity} daysLeft={remaining} />
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.desc} numberOfLines={2}>
                {event.description}
              </Text>
              {local ? <Text style={styles.hereTag}>Affects this area</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    fontSize: 18,
  },
  header: {
    color: palette.cyan,
    fontSize: typography.body,
    fontWeight: '800',
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    width: 220,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  chipLocal: {
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
  },
  chipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  title: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  desc: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  hereTag: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 6,
  },
  empty: {
    marginBottom: spacing.md,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: palette.cyan,
    fontSize: typography.subtitle,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
