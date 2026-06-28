import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { PremiumScreen } from '../premium/PremiumScreen';

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bottomNav?: ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
  background?: 'default' | 'hero' | 'hub';
}

export function AppShell(props: AppShellProps) {
  return <PremiumScreen {...props} />;
}
