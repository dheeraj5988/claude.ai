import React from 'react';

interface AuraLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Aura Original Brand Emblem
 * An original, geometric multi-faceted aperture and glowing core
 * representing unified intelligence, clarity, and multi-model synthesis.
 */
export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 24,
  className = '',
  color = '#E07A5F',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Aura Logo"
      role="img"
    >
      <defs>
        <linearGradient id="aura-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#E07A5F" />
          <stop offset="100%" stopColor="#C95A3B" />
        </linearGradient>
        <linearGradient id="aura-grad-core" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#E07A5F" />
        </linearGradient>
      </defs>

      {/* Outer Orbital Facets (Unified intelligence halo) */}
      <g fill={color || 'url(#aura-grad-primary)'}>
        {/* Top & Bottom Beacons */}
        <polygon points="50,4 57,20 50,26 43,20" opacity="0.95" />
        <polygon points="50,96 57,80 50,74 43,80" opacity="0.95" />

        {/* Left & Right Beacons */}
        <polygon points="4,50 20,43 26,50 20,57" opacity="0.95" />
        <polygon points="96,50 80,43 74,50 80,57" opacity="0.95" />

        {/* Diagonal Beacons (North-West, North-East, South-West, South-East) */}
        <polygon points="17,17 32,25 28,32 20,30" opacity="0.8" />
        <polygon points="83,17 80,30 72,32 68,25" opacity="0.8" />
        <polygon points="17,83 20,70 28,68 32,75" opacity="0.8" />
        <polygon points="83,83 68,75 72,68 80,70" opacity="0.8" />

        {/* Dynamic Inner Prismatic Ring */}
        <path
          d="M50 22L70 30L78 50L70 70L50 78L30 70L22 50L30 30Z"
          fill="none"
          stroke={color || 'url(#aura-grad-primary)'}
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </g>

      {/* Central Luminous Radiant Core */}
      <polygon
        points="50,34 66,50 50,66 34,50"
        fill="url(#aura-grad-core)"
      />

      {/* Core Specular Accent */}
      <circle cx="50" cy="50" r="4" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
};
