import { Platform } from 'react-native';

/** Presentation hook — extend with expo-haptics when native module is added */
export function triggerPressHaptic(_kind: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  // Native haptic feedback slot — no-op until expo-haptics is linked
}

/** Sound hook slot for microinteraction audio */
export function triggerActionSound(_key: string) {
  // Audio feedback slot — presentation layer only
}
