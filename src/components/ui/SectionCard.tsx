import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { GlassCard } from '../premium/GlassCard';
import { AccentTone } from '../../theme/theme';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tone?: AccentTone;
  style?: ViewStyle;
  headerRight?: ReactNode;
  elevated?: boolean;
}

export function SectionCard(props: SectionCardProps) {
  return <GlassCard {...props} />;
}
