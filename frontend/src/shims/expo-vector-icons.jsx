// Shim for @expo/vector-icons in web builds
import React from 'react';

const createIconComponent = (name) => {
  const IconComponent = ({ name: iconName, size = 24, color = '#000', style, ...props }) => (
    <span style={{ fontSize: size, color, ...style }} {...props}>
      {iconName}
    </span>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

export const FontAwesome = createIconComponent('FontAwesome');
export const Octicons = createIconComponent('Octicons');
export const MaterialIcons = createIconComponent('MaterialIcons');
export const Ionicons = createIconComponent('Ionicons');

export default { FontAwesome, Octicons, MaterialIcons, Ionicons };
