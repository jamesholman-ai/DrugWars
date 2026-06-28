import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CityNewsEntry } from '../../types/cityNews';
import { AccentTone, accentMap, palette, radius, spacing, typography } from '../../theme/theme';

const CATEGORY_LABEL: Record<CityNewsEntry['category'], string> = {
  world: 'WORLD',
  market: 'MARKET',
  empire: 'EMPIRE',
  finance: 'FINANCE',
  reputation: 'REP',
  flavor: 'WIRE',
  police: 'POLICE',
};

function toneToAccent(tone: CityNewsEntry['tone']): AccentTone {
  if (tone === 'good') return 'green';
  if (tone === 'bad' || tone === 'urgent') return 'red';
  if (tone === 'neutral') return 'cyan';
  return 'neutral';
}

interface CityNewsFeedProps {
  entries: CityNewsEntry[];
  maxItems?: number;
  onPressEntry?: (entry: CityNewsEntry) => void;
}

export function CityNewsFeed({ entries, maxItems = 5, onPressEntry }: CityNewsFeedProps) {
  const shown = entries.slice(0, maxItems);
  if (shown.length === 0) {
    return (
      <Text style={styles.empty}>No headlines yet — move product, expand the empire, and the city will talk.</Text>
    );
  }

  return (
    <View style={styles.list}>
      {shown.map((entry) => {
        const accent = accentMap[toneToAccent(entry.tone)];
        const Row = onPressEntry ? Pressable : View;
        return (
          <Row
            key={entry.id}
            style={[styles.row, { borderLeftColor: accent.border }]}
            {...(onPressEntry ? { onPress: () => onPressEntry(entry) } : {})}
          >
            <View style={styles.rowTop}>
              <Text style={[styles.category, { color: accent.text }]}>
                {CATEGORY_LABEL[entry.category]}
              </Text>
              <Text style={styles.day}>Day {entry.day}</Text>
            </View>
            <Text style={styles.headline}>{entry.headline}</Text>
            {entry.detail ? <Text style={styles.detail}>{entry.detail}</Text> : null}
            {entry.sentiment ? (
              <Text style={styles.sentiment}>{entry.sentiment.toUpperCase()} SENTIMENT</Text>
            ) : null}
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  category: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  day: {
    color: palette.textMuted,
    fontSize: 9,
  },
  headline: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 18,
  },
  detail: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
    lineHeight: 16,
  },
  sentiment: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  empty: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
