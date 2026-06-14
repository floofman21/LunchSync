import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

// The Crumb logo mark: a bitten disc with two crumbs breaking off.
// disc/crumb/bg control colors:
//   - App tile: disc=white, crumb=white, bg=persimmon
//   - Inline on white: disc=espresso, crumb=persimmon, bg=white (default)
export default function CrumbIcon({
  size = 32,
  disc  = theme.colors.espresso,
  crumb = theme.colors.honey,
  bg    = theme.colors.bg,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx="45" cy="56" r="27" fill={disc} />
      {/* bite — bg-colored circle carves the upper-right */}
      <Circle cx="74" cy="40" r="15" fill={bg} />
      {/* two crumbs */}
      <Circle cx="72" cy="32" r="5"   fill={crumb} />
      <Circle cx="80" cy="55" r="6.5" fill={crumb} />
    </Svg>
  );
}
