import React, { memo, ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScrollContentPaddingBottom } from '../../layout/bottomNavLayout';
import { AAABackground } from './AAABackground';

interface AAACommandShellProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
  style?: ViewStyle;
}

function AAACommandShellInner({
  children,
  header,
  footer,
  scroll = true,
  scrollRef,
  style,
}: AAACommandShellProps) {
  const insets = useSafeAreaInsets();
  const hasFooter = footer != null;
  const scrollBottomPadding = getScrollContentPaddingBottom(insets.bottom, hasFooter);

  const body = (
    <View style={[styles.inner, { paddingTop: insets.top + 8 }, style]}>
      {header}
      {children}
    </View>
  );

  return (
    <AAABackground>
      <View style={styles.frame}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{body}</View>
        )}
        {footer}
      </View>
    </AAABackground>
  );
}

export const AAACommandShell = memo(AAACommandShellInner);

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  inner: {
    flex: 1,
  },
});
