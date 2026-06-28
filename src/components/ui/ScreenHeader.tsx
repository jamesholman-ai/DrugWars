import React, { ReactNode } from 'react';
import { HeroHeader } from '../premium/HeroHeader';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  day?: number;
  location?: string;
  rank?: string;
  rankProgress?: number;
  onLocationPress?: () => void;
  rightSlot?: ReactNode;
}

export function ScreenHeader(props: ScreenHeaderProps) {
  return <HeroHeader {...props} />;
}
