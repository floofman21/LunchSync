import React from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const TONE_COLORS = {
  honey: theme.colors.honey,
  sage:  theme.colors.sage,
  cocoa: theme.colors.cocoa,
};

export function Button({ label, onPress, variant = 'primary', active = false, tone = 'honey', disabled = false, style }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const shrink = () => Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }).start();
  const grow   = () => Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress && onPress();
  };

  const toneColor = TONE_COLORS[tone] ?? theme.colors.honey;

  const containerStyle = [
    s.base,
    variant === 'primary'   && s.primary,
    variant === 'secondary' && s.secondary,
    variant === 'segment'   && [s.segment, active && { backgroundColor: toneColor }],
    variant === 'ghost'     && s.ghost,
    disabled && s.disabled,
    style,
  ];

  const labelStyle = [
    s.label,
    variant === 'primary'   && s.labelPrimary,
    variant === 'secondary' && s.labelSecondary,
    variant === 'segment'   && [s.labelSegment, active && s.labelSegmentActive],
    variant === 'ghost'     && s.labelGhost,
  ];

  return (
    <Pressable onPress={handlePress} onPressIn={shrink} onPressOut={grow} disabled={disabled}>
      <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
        <Text style={labelStyle}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.espresso,
    ...theme.shadow.sm,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.sm,
  },
  segment: {
    backgroundColor: theme.colors.cream,
    paddingVertical: theme.space.xs + 2,
    paddingHorizontal: theme.space.md,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: theme.colors.onDark,
  },
  labelSecondary: {
    color: theme.colors.ink,
  },
  labelSegment: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  labelSegmentActive: {
    color: theme.colors.onDark,
  },
  labelGhost: {
    color: theme.colors.honey,
  },
});
