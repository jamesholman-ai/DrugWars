import React, { memo, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RegistryArt } from '../../assets/imageRegistry';
import { palette, radius, spacing } from '../../theme/theme';
import { SmartImageBackground } from './SmartImageBackground';
import { FitMode, FocalPoint, FIT_PRESETS } from './imageFit';

interface BackgroundImageCardProps {
  art: RegistryArt;
  height?: number;
  borderColor?: string;
  onPress?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fitMode?: FitMode;
  focalPoint?: FocalPoint;
  overlay?: 'dark' | 'medium' | 'light' | boolean;
  overlayStrength?: number;
}

const LEGACY_OVERLAY_STRENGTH: Record<'dark' | 'medium' | 'light', number> = {
  dark: 0.45,
  medium: 0.35,
  light: 0.25,
};

function BackgroundImageCardInner({
  art,
  height,
  borderColor = palette.border,
  onPress,
  children,
  footer,
  style,
  fitMode = 'card',
  focalPoint = 'center',
  overlay = true,
  overlayStrength,
}: BackgroundImageCardProps) {
  const resolvedOverlay =
    typeof overlay === 'string' ? true : overlay !== false;
  const resolvedStrength =
    overlayStrength ??
    (typeof overlay === 'string' ? LEGACY_OVERLAY_STRENGTH[overlay] : 0.35);

  const body = (
    <View style={[styles.wrap, { borderColor }, style]}>
      <SmartImageBackground
        source={art.source}
        resizeMode="cover"
        focalPoint={focalPoint}
        sourceAspectRatio={art.aspectRatio}
        sourceNativeWidth={art.nativeWidth}
        overlay={resolvedOverlay}
        overlayStrength={resolvedStrength}
        height={height}
        style={styles.imageArea}
      >
        {children ? <View style={styles.content}>{children}</View> : null}
      </SmartImageBackground>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

export const BackgroundImageCard = memo(BackgroundImageCardInner);

export function FitImageCard(
  props: BackgroundImageCardProps & { preset?: keyof typeof FIT_PRESETS }
) {
  const { preset, ...rest } = props;
  const presetOpts = preset ? FIT_PRESETS[preset] : {};
  return <BackgroundImageCard {...presetOpts} {...rest} />;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: palette.bgCard,
    marginBottom: spacing.sm,
  },
  imageArea: {
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    minHeight: 72,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
