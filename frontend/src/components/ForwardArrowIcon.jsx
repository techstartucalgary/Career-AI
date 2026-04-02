import React from 'react';
import { View } from 'react-native';
import { THEME } from '../styles/theme';

const { colors: COLORS } = THEME;

/**
 * Geometric forward arrow (line + chevron) — matches the header log out control.
 */
export default function ForwardArrowIcon({ color = COLORS.textPrimary, size = 16 }) {
  const s = size / 16;
  const lineH = Math.max(1.5, 2 * s);
  const headTop = 4 * s;
  const lineTop = 7 * s;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: lineTop,
          width: 12 * s,
          height: lineH,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: headTop,
          width: 0,
          height: 0,
          borderTopWidth: 4 * s,
          borderBottomWidth: 4 * s,
          borderLeftWidth: 6 * s,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        }}
      />
    </View>
  );
}
