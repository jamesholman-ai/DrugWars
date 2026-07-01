import { ImageContentFit, ImageContentPosition } from 'expo-image';

export type FitMode = 'cover' | 'contain' | 'wideHero' | 'card';
export type FocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface ImageFitOptions {
  fitMode?: FitMode;
  focalPoint?: FocalPoint;
  overlay?: boolean;
  overlayStrength?: number;
}

const FOCAL_POSITION: Record<FocalPoint, ImageContentPosition> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
};

/** Minimum native width before `cover` is safe on wide containers. */
export const MIN_COVER_NATIVE_WIDTH = 512;

/** Prefer letterboxing over upscaling tiny bitmaps more than ~2×. */
export function resolveDisplayFit(
  requested: 'cover' | 'contain',
  nativeWidth?: number
): 'cover' | 'contain' {
  if (requested === 'contain' || nativeWidth == null) return requested;
  if (nativeWidth < MIN_COVER_NATIVE_WIDTH) return 'contain';
  return 'cover';
}

/** Map fit modes to expo-image contentFit — never stretch. */
export function resolveContentFit(fitMode: FitMode): ImageContentFit {
  if (fitMode === 'contain') return 'contain';
  return 'cover';
}

export function resolveContentPosition(focalPoint: FocalPoint = 'center'): ImageContentPosition {
  return FOCAL_POSITION[focalPoint];
}

/** Preferred container aspect ratios to reduce heavy cropping. */
export function resolveAspectRatio(fitMode: FitMode): number | undefined {
  switch (fitMode) {
    case 'wideHero':
      return 16 / 9;
    case 'card':
      return 16 / 10;
    default:
      return undefined;
  }
}

/** Build gradient overlay stops from a single strength value (0–1). */
export function buildImageOverlayColors(strength: number): readonly [string, string, string] {
  const top = Math.min(0.55, strength * 0.35);
  const mid = Math.min(0.75, strength * 0.85);
  const bottom = Math.min(0.96, 0.55 + strength * 0.45);
  return [
    `rgba(0,0,0,${top.toFixed(2)})`,
    `rgba(0,0,0,${mid.toFixed(2)})`,
    `rgba(5,6,10,${bottom.toFixed(2)})`,
  ];
}

export const FIT_PRESETS = {
  cinematicIntro: {
    fitMode: 'cover' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.45,
  },
  commandHero: {
    fitMode: 'cover' as const,
    focalPoint: 'top' as const,
    overlay: true,
    overlayStrength: 0.35,
  },
  travelCard: {
    fitMode: 'card' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.3,
  },
  cityInfo: {
    fitMode: 'card' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.35,
  },
  propertyCard: {
    fitMode: 'card' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.35,
  },
  thumbnail: {
    fitMode: 'card' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.25,
  },
  worldEvent: {
    fitMode: 'wideHero' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.35,
  },
  marketHeader: {
    fitMode: 'wideHero' as const,
    focalPoint: 'top' as const,
    overlay: true,
    overlayStrength: 0.35,
  },
  reference: {
    fitMode: 'contain' as const,
    focalPoint: 'center' as const,
    overlay: false,
    overlayStrength: 0,
  },
  loading: {
    fitMode: 'cover' as const,
    focalPoint: 'center' as const,
    overlay: true,
    overlayStrength: 0.4,
  },
} satisfies Record<string, Required<ImageFitOptions>>;
