import React from 'react';
import { AppLogo } from './index';
import { AuraLogo } from '../components/AuraLogo';

interface AppLogoIconProps {
  logo?: AppLogo | null;
  size?: number;
  className?: string;
}

export const AppLogoIcon: React.FC<AppLogoIconProps> = ({
  logo,
  size = 24,
  className = '',
}) => {
  if (!logo || logo.type === 'svg-sunburst') {
    return <AuraLogo size={size} color={logo?.color || '#E07A5F'} className={className} />;
  }

  if (logo.type === 'custom-image' && logo.customDataUrl) {
    return (
      <img
        src={logo.customDataUrl}
        alt="App Logo"
        style={{ width: size, height: size }}
        className={`object-contain rounded-md ${className}`}
      />
    );
  }

  if (logo.type === 'svg-spark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={logo.color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
      </svg>
    );
  }

  if (logo.type === 'svg-gem') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={logo.color}
        className={className}
      >
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
      </svg>
    );
  }

  // Minimal
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={logo.color}
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="#141413" />
    </svg>
  );
};
