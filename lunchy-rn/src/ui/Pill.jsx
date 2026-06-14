import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

export function Pill({ label, onPress, active = false, tone = 'honey', style }) {
  const toneColor = {
    honey: theme.colors.honey,
    sage:  theme.colors.sage,
    cocoa: theme.colors.cocoa,
  }[tone] ?? theme.colors.honey;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress && onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[s.pill, active ? { backgroundColor: toneColor } : s.inactive, style]}
    >
      <Text style={[s.label, active ? s.labelActive : s.labelInactive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    borderRadius: theme.radius.chip,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  labelActive: {
    color: theme.colors.onDark,
  },
  labelInactive: {
    color: theme.colors.muted,
  },
});
