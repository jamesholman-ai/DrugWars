import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CinematicLocationIntro } from '../components/aaa/CinematicLocationIntro';
import { RootStackParamList } from '../types/game';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationIntro'>;

export function LocationIntroScreen({ navigation, route }: Props) {
  const { cityId, areaId, day, returnTo } = route.params;

  return (
    <CinematicLocationIntro
      cityId={cityId}
      areaId={areaId}
      day={day}
      onContinue={() => {
        if (returnTo === 'Game') {
          navigation.replace('Game');
        } else {
          navigation.navigate(returnTo as never);
        }
      }}
    />
  );
}
