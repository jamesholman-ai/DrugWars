import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { ActiveWorldEvent } from '../types/game';
import { daysRemaining, eventAppliesToLocation } from '../game/worldEvents';
import { COMMODITY_MAP } from '../data/commodities';
import { getAreaLabel, parseAreaKey } from '../data/locations';
import { colors, fonts, spacing } from '../utils/theme';

interface WorldEventsPanelProps {
  events: ActiveWorldEvent[];
  currentDay: number;
  currentAreaKey: string;
}

function severityTone(severity: ActiveWorldEvent['severity']): 'fair' | 'warn' | 'high' {
  if (severity === 'low') return 'fair';
  if (severity === 'medium') return 'warn';
  return 'high';
}

function formatLocationLabel(id: string): string {
  const parsed = parseAreaKey(id);
  if (parsed) return getAreaLabel(parsed.cityId, parsed.areaId);
  return id;
}

function formatScope(event: ActiveWorldEvent): string {
  const locs =
    event.affectedLocations.length > 0
      ? event.affectedLocations.map(formatLocationLabel).slice(0, 3).join(', ')
      : 'Worldwide';

  if (event.affectedCommodities.length === 0) {
    return locs;
  }

  const goods = event.affectedCommodities
    .map((id) => COMMODITY_MAP[id]?.name ?? id)
    .join(', ');
  return `${locs} · ${goods}`;
}

export function WorldEventsPanel({
  events,
  currentDay,
  currentAreaKey,
}: WorldEventsPanelProps) {
  if (events.length === 0) {
    return (
      <Card title="WORLD CONDITIONS">
        <Text style={styles.calm}>Streets are quiet. No major conditions active.</Text>
      </Card>
    );
  }

  return (
    <Card title="WORLD CONDITIONS" variant="warning">
      {events.map((event, index) => {
        const remaining = daysRemaining(event, currentDay);
        const local = eventAppliesToLocation(event, currentAreaKey);

        return (
          <View key={event.id} style={[styles.row, index === 0 && styles.rowFirst]}>
            <View style={styles.rowHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Badge label={event.severity.toUpperCase()} tone={severityTone(event.severity)} />
            </View>
            <Text style={styles.desc}>{event.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatScope(event)}</Text>
              <Text style={[styles.days, local && styles.daysLocal]}>
                {remaining}d left{local ? ' · HERE' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  calm: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    paddingRight: spacing.sm,
  },
  desc: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    flex: 1,
  },
  days: {
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
  },
  daysLocal: {
    color: colors.accent,
  },
});
