import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme/theme';

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bottomNav?: ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
}

export function AppShell({
  header,
  children,
  footer,
  bottomNav,
  contentStyle,
  scroll = true,
}: AppShellProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header}
      {body}
      {footer}
      {bottomNav ? (
        <SafeAreaView edges={['bottom']} style={styles.bottomNavWrap}>
          {bottomNav}
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scroll: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bottomNavWrap: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.bgElevated,
  },
});
