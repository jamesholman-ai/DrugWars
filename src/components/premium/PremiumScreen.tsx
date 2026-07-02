import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScrollContentPaddingBottom } from '../../layout/bottomNavLayout';
import { PremiumBackground } from './PremiumBackground';
import { spacing } from '../../theme/theme';

interface PremiumScreenProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bottomNav?: ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
  background?: 'default' | 'hero' | 'hub';
}

export function PremiumScreen({
  header,
  children,
  footer,
  bottomNav,
  contentStyle,
  scroll = true,
  background = 'default',
}: PremiumScreenProps) {
  const insets = useSafeAreaInsets();
  const hasBottomNav = bottomNav != null;
  const scrollBottomPadding = getScrollContentPaddingBottom(insets.bottom, hasBottomNav);

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: scrollBottomPadding },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <PremiumBackground variant={background}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.frame}>
          {header}
          {body}
          {footer}
          {bottomNav}
        </View>
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  frame: {
    flex: 1,
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
  },
});
