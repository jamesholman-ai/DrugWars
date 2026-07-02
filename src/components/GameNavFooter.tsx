import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from './ui';
import { getEffectiveBottomInset } from '../layout/bottomNavLayout';
import { RootStackParamList } from '../types/game';
import { MainNavTab } from '../navigation/mainNav';

interface GameNavFooterProps {
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>;
  active: MainNavTab;
}

export function GameNavFooter({ navigation, active }: GameNavFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = getEffectiveBottomInset(insets.bottom);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <BottomNav
        active={active}
        onNavigate={(route) => navigation.navigate(route as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(16,19,26,0.95)',
  },
});
