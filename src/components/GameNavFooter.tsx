import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomNav } from './ui';
import { RootStackParamList } from '../types/game';
import { MainNavTab } from '../navigation/mainNav';

interface GameNavFooterProps {
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>;
  active: MainNavTab;
}

export function GameNavFooter({ navigation, active }: GameNavFooterProps) {
  return (
    <BottomNav
      active={active}
      onNavigate={(route) => navigation.navigate(route as never)}
    />
  );
}
