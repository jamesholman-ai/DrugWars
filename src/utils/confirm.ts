import { Alert, Platform } from 'react-native';

/** Cross-platform confirm dialog (Alert.alert is unreliable on web). */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'OK'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
