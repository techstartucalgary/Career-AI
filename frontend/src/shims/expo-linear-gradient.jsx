import React from 'react';

export function LinearGradient({ colors, style, children, ...props }) {
  const gradientStyle = {
    ...style,
    background: colors && colors.length >= 2
      ? `linear-gradient(to bottom, ${colors.join(', ')})`
      : undefined,
  };

  return (
    <div style={gradientStyle} {...props}>
      {children}
    </div>
  );
}
