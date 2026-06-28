import React from 'react';
import { ViewStyle } from 'react-native';
import { MoneyPanel } from '../premium/MoneyPanel';
import { AccentTone } from '../../theme/theme';

interface MoneyCardProps {
  label: string;
  amount: string;
  amountValue?: number;
  tone?: AccentTone;
  icon?: string;
  style?: ViewStyle;
  hero?: boolean;
}

export function MoneyCard(props: MoneyCardProps) {
  return <MoneyPanel {...props} />;
}
