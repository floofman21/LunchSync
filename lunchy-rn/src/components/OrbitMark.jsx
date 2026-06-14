import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

export default function OrbitMark({ size = 30, ring = theme.colors.espresso, dot = theme.colors.honey }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 74 74" fill="none">
      <Circle cx="37" cy="37" r="24" stroke={ring} strokeWidth="7" />
      <Circle cx="37" cy="13" r="6.5" fill={dot} />
    </Svg>
  );
}
