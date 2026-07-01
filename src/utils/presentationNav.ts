import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/game';

export function navigateWithLocationIntro(
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate'>,
  params: {
    cityId: string;
    areaId: string;
    day: number;
    returnTo?: keyof RootStackParamList;
  }
): void {
  navigation.navigate('LocationIntro', {
    cityId: params.cityId,
    areaId: params.areaId,
    day: params.day,
    returnTo: params.returnTo ?? 'Game',
  });
}
