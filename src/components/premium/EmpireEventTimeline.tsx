import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmpireEventEntry } from '../../types/empire';
import { palette, spacing, typography } from '../../theme/theme';

interface EmpireEventTimelineProps {
  events: EmpireEventEntry[];
  emptyLabel?: string;
}

export function EmpireEventTimeline({ events, emptyLabel = 'No recent events.' }: EmpireEventTimelineProps) {
  if (events.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {events.map((event) => (
        <View key={event.id} style={styles.row}>
          <View
            style={[
              styles.dot,
              event.tone === 'good' && styles.dotGood,
              event.tone === 'bad' && styles.dotBad,
            ]}
          />
          <View style={styles.body}>
            <Text style={styles.day}>Day {event.day}</Text>
            <Text style={styles.message}>{event.message}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.textMuted,
    marginTop: 5,
  },
  dotGood: { backgroundColor: palette.neon },
  dotBad: { backgroundColor: palette.danger },
  body: { flex: 1 },
  day: { color: palette.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  message: { color: palette.textSecondary, fontSize: typography.caption, lineHeight: 16 },
  empty: { color: palette.textMuted, fontSize: typography.caption, lineHeight: 18 },
});
