import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, radius, spacing, touch } from '../utils/theme';

interface HubActionBarProps {
  onMarket: () => void;
  onTravel: () => void;
  onInventory: () => void;
  onContacts?: () => void;
  onUpgrades?: () => void;
  onProgress?: () => void;
  onStay?: () => void;
}

export function HubActionBar({
  onMarket,
  onTravel,
  onInventory,
  onContacts,
  onUpgrades,
  onProgress,
  onStay,
}: HubActionBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <HubButton label="MARKET" icon="◈" onPress={onMarket} primary />
        <HubButton label="TRAVEL" icon="◎" onPress={onTravel} />
        <HubButton label="STASH" icon="▣" onPress={onInventory} />
        {onContacts ? <HubButton label="CREW" icon="☷" onPress={onContacts} /> : null}
      </View>
      <View style={styles.bar}>
        {onStay ? <HubButton label="STAY" icon="◉" onPress={onStay} accent /> : null}
        {onUpgrades ? <HubButton label="UPGRADES" icon="▲" onPress={onUpgrades} /> : null}
        {onProgress ? <HubButton label="STATUS" icon="◆" onPress={onProgress} /> : null}
      </View>
    </View>
  );
}

function HubButton({
  label,
  icon,
  onPress,
  primary,
  accent,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  primary?: boolean;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        primary && styles.btnPrimary,
        accent && styles.btnAccent,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, primary && styles.iconPrimary, accent && styles.iconAccent]}>
        {icon}
      </Text>
      <Text style={[styles.label, primary && styles.labelPrimary, accent && styles.labelAccent]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: touch.minHeight,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent,
  },
  btnAccent: {
    backgroundColor: 'rgba(255, 45, 149, 0.1)',
    borderColor: colors.accentPink,
  },
  icon: {
    fontSize: 18,
    color: colors.textDim,
    fontFamily: fonts.mono,
    marginBottom: 2,
  },
  iconPrimary: {
    color: colors.accent,
  },
  iconAccent: {
    color: colors.accentPink,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  labelPrimary: {
    color: colors.accent,
  },
  labelAccent: {
    color: colors.accentPink,
  },
});
