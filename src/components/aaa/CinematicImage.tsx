import React, { memo } from 'react';
import { Image } from 'expo-image';
import { ImageStyle, StyleProp, StyleSheet } from 'react-native';
import { ImageSourceProp } from '../../assets/imageRegistry';
import {
  FitMode,
  FocalPoint,
  resolveContentFit,
  resolveContentPosition,
} from './imageFit';

export interface CinematicImageProps {
  source: ImageSourceProp;
  fitMode?: FitMode;
  focalPoint?: FocalPoint;
  style?: StyleProp<ImageStyle>;
  transition?: number;
}

function CinematicImageInner({
  source,
  fitMode = 'cover',
  focalPoint = 'center',
  style,
  transition = 280,
}: CinematicImageProps) {
  if (source == null) return null;

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      contentFit={resolveContentFit(fitMode)}
      contentPosition={resolveContentPosition(focalPoint)}
      cachePolicy="memory-disk"
      transition={transition}
    />
  );
}

export const CinematicImage = memo(CinematicImageInner);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
