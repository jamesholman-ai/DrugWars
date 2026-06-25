import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../utils/theme';

interface EventLogProps {
  messages: string[];
  maxHeight?: number;
}

export function EventLog({ messages, maxHeight = 160 }: EventLogProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>STREET LOG</Text>
        <Text style={styles.count}>{messages.length} entries</Text>
      </View>
      <ScrollView
        style={[styles.scroll, { maxHeight }]}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Text style={styles.empty}>No activity yet.</Text>
        ) : (
          messages.map((msg, i) => (
            <View key={`${msg}-${i}`} style={styles.row}>
              <Text style={styles.prefix}>{'>'}</Text>
              <Text style={[styles.line, i === 0 && styles.lineLatest]}>{msg}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  count: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
  },
  scroll: {
    padding: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs + 2,
  },
  prefix: {
    color: colors.accentDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    width: 14,
    marginTop: 1,
  },
  line: {
    flex: 1,
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
  },
  lineLatest: {
    color: colors.text,
  },
});
