import React from 'react';
import { TouchableOpacityProps, ViewStyle } from 'react-native';
import { NeonButton, NeonButtonSize, NeonButtonVariant } from './premium/NeonButton';

interface GameButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  style?: ViewStyle;
}

export function GameButton({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  disabled,
  onPress,
}: GameButtonProps) {
  const neonVariant: NeonButtonVariant =
    variant === 'primary'
      ? 'primary'
      : variant === 'danger'
        ? 'danger'
        : variant === 'ghost'
          ? 'ghost'
          : 'secondary';

  return (
    <NeonButton
      label={label}
      variant={neonVariant}
      size={size as NeonButtonSize}
      icon={icon}
      disabled={disabled}
      onPress={onPress ? () => onPress(undefined as never) : undefined}
      style={style}
    />
  );
}
