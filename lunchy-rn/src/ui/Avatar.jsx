import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const SIZE_MAP = { sm: 28, md: 36, lg: 48 };

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function hashColor(name = '') {
  const palette = [theme.colors.honey, theme.colors.sage, theme.colors.cocoa, theme.colors.muted];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export function Avatar({ name = '', size = 'md', style }) {
  const px = SIZE_MAP[size] ?? SIZE_MAP.md;
  const bg = hashColor(name);
  return (
    <View style={[s.circle, { width: px, height: px, borderRadius: px / 2, backgroundColor: bg }, style]}>
      <Text style={[s.text, { fontSize: px * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.sm,
  },
  text: {
    color: theme.colors.onDark,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
