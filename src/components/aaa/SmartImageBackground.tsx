import React, { memo, ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ImageSourceProp } from '../../assets/imageRegistry';
import { palette } from '../../theme/theme';
import { CinematicImage } from './CinematicImage';
import {
  FitMode,
  FocalPoint,
  buildImageOverlayColors,
  resolveAspectRatio,
  resolveDisplayFit,
} from './imageFit';

export type ImageResizeMode = 'cover' | 'contain';

export interface SmartImageBackgroundProps {
  source?: ImageSourceProp | null;
  children?: ReactNode;
  resizeMode?: ImageResizeMode;
  fitMode?: FitMode;
  focalPoint?: FocalPoint;
  overlay?: boolean;
  overlayStrength?: number;
  /** Native aspect ratio from GENERATED_IMAGE_META — avoids over-zoom. */
  sourceAspectRatio?: number;
  /** Native pixel width — auto letterbox when source is too small for cover. */
  sourceNativeWidth?: number;
  aspectRatio?: number;
  height?: number;
  fill?: boolean;
  fallbackColor?: string;
  style?: StyleProp<ViewStyle>;
}

function resolveResizeMode(
  resizeMode: ImageResizeMode | undefined,
  fitMode: FitMode | undefined
): ImageResizeMode {
  if (resizeMode) return resizeMode;
  if (fitMode === 'contain') return 'contain';
  return 'cover';
}

function SmartImageBackgroundInner({
  source,
  children,
  resizeMode,
  fitMode,
  focalPoint = 'center',
  overlay = true,
  overlayStrength = 0.35,
  sourceAspectRatio,
  sourceNativeWidth,
  aspectRatio,
  height,
  fill = false,
  fallbackColor = palette.bgCard,
  style,
}: SmartImageBackgroundProps) {
  const requested = resolveResizeMode(resizeMode, fitMode);
  const mode = resolveDisplayFit(requested, sourceNativeWidth);
  const ratio =
    fill || height != null
      ? aspectRatio
      : aspectRatio ?? sourceAspectRatio ?? (fitMode ? resolveAspectRatio(fitMode) : undefined);

  const containerStyle: ViewStyle = {
    overflow: 'hidden',
    backgroundColor: fallbackColor,
    ...(ratio != null && !fill && height == null
      ? { aspectRatio: ratio, width: '100%' }
      : {}),
    ...(height != null ? { height } : {}),
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {source != null ? (
        <CinematicImage
          source={source}
          fitMode={mode}
          focalPoint={focalPoint}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {overlay && overlayStrength > 0 ? (
        <LinearGradient
          colors={[...buildImageOverlayColors(overlayStrength)]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {children}
    </View>
  );
}

export const SmartImageBackground = memo(SmartImageBackgroundInner);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
});
