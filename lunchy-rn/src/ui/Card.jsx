import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function Card({ children, style, dark = false }) {
  return (
    <View style={[s.card, dark ? s.dark : s.light, dark ? theme.shadow.md : theme.shadow.sm, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card:  { borderRadius: theme.radius.card, padding: theme.space.lg },
  light: { backgroundColor: theme.colors.surface },
  dark:  { backgroundColor: theme.colors.espresso },
});
