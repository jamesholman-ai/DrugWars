import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, palette, radius, spacing } from '../theme/theme';

export interface RewardClaimFeedback {
  id: number;
  variant: 'success' | 'error';
  title: string;
  detail?: string;
}

interface RewardClaimToastProps {
  feedback: RewardClaimFeedback | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4000;

export function RewardClaimToast({ feedback, onDismiss }: RewardClaimToastProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!feedback) return undefined;

    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  const isSuccess = feedback.variant === 'success';

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View pointerEvents="box-none" style={styles.overlay}>
        <View
          pointerEvents="box-none"
          style={[styles.host, { bottom: insets.bottom + spacing.md }]}
        >
          <Pressable
            style={[styles.toast, isSuccess ? styles.toastSuccess : styles.toastError]}
            onPress={onDismiss}
          >
            <Text style={styles.title}>{feedback.title}</Text>
            {feedback.detail ? <Text style={styles.detail}>{feedback.detail}</Text> : null}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  toast: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  toastSuccess: {
    backgroundColor: palette.bgCard,
    borderColor: palette.neon,
  },
  toastError: {
    backgroundColor: palette.bgCard,
    borderColor: palette.danger,
  },
  title: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detail: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
