import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../utils/theme';

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  compactHeader?: boolean;
}

export function ScreenLayout({
  title,
  subtitle,
  children,
  footer,
  compactHeader,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.header, compactHeader && styles.headerCompact]}>
        <View style={styles.headerAccent} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, footer ? styles.contentWithFooter : null]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {footer}
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  headerCompact: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  contentWithFooter: {
    paddingBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderBright,
    backgroundColor: colors.surface,
  },
});
