import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function SectionHeader({ label, action, style }) {
  return (
    <View style={[s.row, style]}>
      <Text style={s.label}>{label}</Text>
      {action}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space.sm,
  },
  label: {
    ...theme.type.label,
  },
});
