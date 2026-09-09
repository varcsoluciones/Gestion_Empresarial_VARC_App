import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 28,
  className = '',
  color = '#ffffff'
}) => {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const cx = 50;
  const cy = 50;
  const rDot = 36;
  const rDotSize = 5.5;
  const spokeWidth = 4.4;
  const rRingOuter = 21;
  const rRingInner = 11;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0, color }}
    >
      {/* Radial spokes */}
      {angles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = (cx + rDot * Math.cos(rad)).toFixed(2);
        const y = (cy + rDot * Math.sin(rad)).toFixed(2);
        return (
          <line
            key={`spoke-${deg}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth={spokeWidth}
          />
        );
      })}

      {/* Center ring */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={`M ${cx} ${cy - rRingOuter} A ${rRingOuter} ${rRingOuter} 0 1 0 ${cx} ${
          cy + rRingOuter
        } A ${rRingOuter} ${rRingOuter} 0 1 0 ${cx} ${cy - rRingOuter} Z M ${cx} ${
          cy - rRingInner
        } A ${rRingInner} ${rRingInner} 0 1 1 ${cx} ${
          cy + rRingInner
        } A ${rRingInner} ${rRingInner} 0 1 1 ${cx} ${cy - rRingInner} Z`}
      />

      {/* Outer nodes */}
      {angles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = (cx + rDot * Math.cos(rad)).toFixed(2);
        const y = (cy + rDot * Math.sin(rad)).toFixed(2);
        return (
          <circle
            key={`dot-${deg}`}
            cx={x}
            cy={y}
            r={rDotSize}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
};
