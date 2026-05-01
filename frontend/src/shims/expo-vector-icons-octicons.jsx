// Shim for @expo/vector-icons/Octicons in web builds
import React from 'react';

const Octicons = ({ name, size = 24, color = '#000', style, ...props }) => (
  <span style={{ fontSize: size, color, ...style }} {...props}>
    {name}
  </span>
);

export default Octicons;
