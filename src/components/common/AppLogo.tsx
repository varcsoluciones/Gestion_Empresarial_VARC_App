import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string; // Kept for backward compatibility
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 28,
  className = '',
  style = {}
}) => {
  return (
    <img
      src="/app-icon.png"
      alt="Gestor Modular"
      width={size}
      height={size}
      className={`app-logo-image ${className}`}
      style={{
        display: 'block',
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.max(4, Math.round(size * 0.2))}px`,
        objectFit: 'contain',
        ...style
      }}
    />
  );
};

