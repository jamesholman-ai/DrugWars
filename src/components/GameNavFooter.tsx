import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomNav, GameTab } from './ui';
import { RootStackParamList } from '../types/game';

interface GameNavFooterProps {
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>;
  active: GameTab | 'Game';
}

export function GameNavFooter({ navigation, active }: GameNavFooterProps) {
  return (
    <BottomNav
      active={active}
      onHub={() => navigation.navigate('Game')}
      onNavigate={(tab) => navigation.navigate(tab)}
    />
  );
}
