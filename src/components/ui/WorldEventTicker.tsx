import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActiveWorldEvent, WorldEventType } from '../../types/game';
import { daysRemaining, eventAppliesToLocation } from '../../game/worldEvents';
import { WorldEventBadge } from './WorldEventBadge';
import { fonts, palette, radius, spacing } from '../../theme/theme';

const TYPE_LABEL: Record<WorldEventType, string> = {
  market_shortage: 'SHORTAGE',
  market_crash: 'CRASH',
  market_boom: 'BOOM',
  police_crackdown: 'CRACKDOWN',
  gang_war: 'GANG WAR',
  airport_lockdown: 'AIRPORT',
  supplier_flood: 'FLOOD',
  informant_network_buzz: 'INTEL',
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
        <Text style={styles.emptyLabel}>WORLD TICKER</Text>
        <Text style={styles.emptyText}>No active shortages, crackdowns, or booms.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>WORLD TICKER</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {events.map((event) => {
          const remaining = daysRemaining(event, currentDay);
          const local = eventAppliesToLocation(event, currentAreaKey);
          const typeLabel = TYPE_LABEL[event.type] ?? event.type.toUpperCase();

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
              {local ? <Text style={styles.hereTag}>AFFECTS THIS AREA</Text> : null}
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
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
  },
  header: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    width: 200,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
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
    marginBottom: 4,
  },
  typeLabel: {
    color: palette.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    color: palette.textSecondary,
    fontSize: 9,
    lineHeight: 13,
  },
  hereTag: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  empty: {
    marginBottom: spacing.md,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  emptyLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: 10,
  },
});
