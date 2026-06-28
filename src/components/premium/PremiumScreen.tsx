import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <PremiumBackground variant={background}>
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
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
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
    paddingBottom: spacing.lg,
  },
  bottomNavWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(16,19,26,0.95)',
  },
});
