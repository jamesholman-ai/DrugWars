import React, { memo, ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const body = (
    <View style={[styles.inner, { paddingTop: insets.top + 8 }, style]}>
      {header}
      {children}
    </View>
  );

  return (
    <AAABackground variant="hub">
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
      {footer}
    </AAABackground>
  );
}

export const AAACommandShell = memo(AAACommandShellInner);

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  inner: {
    flex: 1,
  },
});
